import { Store } from "@tanstack/store";
import { z } from "zod";

export { default as invariant } from "tiny-invariant";

type SubmitState =
  | {
      status: "submitPending";
      isSubmitted: false;
      isSubmitting: false;
    }
  | {
      status: "submitting";
      isSubmitting: true;
      isSubmitted: false;
    }
  | {
      status: "submitted";
      isSubmitting: false;
      isSubmitted: true;
      isSubmitSuccessful: boolean;
    };

type FormStore<Data extends FormData = FormData> = {
  isLoading: boolean;
  isDirty: boolean;
  submitCount: number;
  touchedFields: {};
  dirtyFields: {};
  errors: FieldErrors<Data>;
} & SubmitState;

type UnregisteredField = {
  name: string;
  status: "created";
};

type RegisteredField<FieldType> = {
  name: string;
  status: "registered";
  ref: HTMLInputElement;
  registerOptions?: RegisterOptions<FieldType>;
};

type Field<FieldType> = UnregisteredField | RegisteredField<FieldType>;

type ValidationResult<Data extends FormData, Input extends FormData> =
  | {
      status: "success";
      values: Data;
    }
  | {
      status: "error";
      errors: FieldErrors<Input>;
    };

function createField(name: string): Field<any> {
  return {
    name,
    status: "created",
  };
}

type PromiseLike<T> = T | Promise<T>;

export type RegisterOptions<FieldType> = {
  required?: boolean;
} & (FieldType extends number
  ? {
      valueAsNumber: true;
    }
  : {}) &
  (FieldType extends Date ? { valueAsDate: true } : {});

export type FormData = Record<string, any>;

export type FieldError = {
  type: string;
  message?: string;
};

export type FieldErrors<Input extends FormData = FormData> = {
  [K in keyof Input]?: FieldError;
};

interface Resolver<Data extends FormData, Input extends FormData = Data> {
  resolve(input: Input): PromiseLike<ValidationResult<Data, Input>>;
}

export function zodResolver<Schema extends z.Schema>(
  schema: Schema
): Resolver<z.infer<Schema>, z.input<Schema>> {
  return {
    async resolve(input) {
      const result = await schema.safeParseAsync(input);

      if (result.success) {
        return {
          status: "success",
          values: result.data,
        };
      } else {
        let errorList = result.error.errors;

        const errors = result.error.isEmpty
          ? {}
          : errorList.reduce((errors, error) => {
              const { code, message } = error;
              const path = error.path.join(".");

              if (!errors[path]) {
                if ("unionErrors" in error) {
                  const unionError = error.unionErrors[0]?.errors[0];

                  if (unionError)
                    errors[path] = {
                      message: unionError.message,
                      type: unionError.code,
                    };
                } else {
                  errors[path] = { message, type: code };
                }
              }

              if ("unionErrors" in error) {
                error.unionErrors.forEach((unionError) =>
                  unionError.errors.forEach((e) => errorList.push(e))
                );
              }

              return errors;
            }, {} as Record<string, FieldError>);

        return {
          status: "error",
          errors,
        };
      }
    },
  };
}

export interface FormOptions<
  Data extends FormData,
  Input extends FormData = Data
> {
  useNativeValidation?: boolean;
  resolver?: Resolver<Data, Input>;
}

function fieldIsRegistered(
  field: Field<any>
): field is Extract<Field<any>, { status: "registered" }> {
  return field.status === "registered";
}

function validateField(field: Field<any>) {
  if (!fieldIsRegistered(field))
    throw new Error(`Field ${field.name} is not registered!`);

  const { ref, registerOptions } = field;

  const isTextEmpty =
    // Form elements
    ref.value === "";

  let error = null;

  if (registerOptions?.required && isTextEmpty) {
    error = {
      type: "required",
      ref,
    };
  }

  return error;
}

export class Form<
  Data extends FormData = FormData,
  Input extends FormData = Data
> {
  store = new Store<FormStore<Input>>(getInitialFormState(), {
    onUpdate: (state) => {
      this.state = state;
    },
  });
  state = this.store.state;

  fields = new Map<keyof Data, Field<any>>();
  fieldValues: Input = {} as any;
  fieldErrors: FieldErrors<Input> = {};

  constructor(public options?: FormOptions<Data, Input>) {
    this.store.setState((s) => ({
      ...s,
      isLoading: false,
    }));
  }

  register<Key extends keyof Input & string>(
    name: Key,
    options?: Partial<RegisterOptions<Data[Key]>>
  ) {
    console.log("register");
    if (!this.fields.has(name)) this.fields.set(name, createField(name));

    return {
      ref: (el: HTMLInputElement | null) => {
        if (el) {
          this.fields.set(name, {
            name: name,
            status: "registered",
            ref: el,
            registerOptions: options,
          });
        }
      },
      onInput: (e: InputEvent) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        const field = this.fields.get(target.name);
        if (!field || field.status !== "registered") return;

        const currentValue = target.type
          ? getFieldValue(field)
          : getInputValue(target);

        this.fieldValues[name] = currentValue as any;

        // TODO: validation
      },
      name,
      ...(this.options?.useNativeValidation
        ? { required: options?.required }
        : null),
    };
  }

  unregister(name: keyof Input & string) {
    this.fields.delete(name);
    delete this.fieldValues[name];
  }

  handleSubmit(
    onValid: (data: Data) => PromiseLike<any>,
    onInvalid?: (errors: FieldErrors<Input>) => PromiseLike<any>
  ) {
    return async (e: Event) => {
      e.preventDefault();

      this.store.setState((s) => ({
        ...s,
        status: "submitting",
        isSubmitting: true,
        isSubmitted: false,
      }));

      let result: ValidationResult<Data, Input>;

      if (this.options?.resolver) {
        result = await this.options.resolver.resolve(this.fieldValues);
      } else {
        let errors: null | FieldErrors<Input> = null;

        for (const [name, field] of this.fields.entries()) {
          if (field.status !== "registered") continue;

          const validationError = validateField(field);

          if (validationError !== null)
            errors ??= {
              ...(errors ?? {}),
              [name]: validationError,
            };
        }

        result =
          errors !== null
            ? {
                status: "error",
                errors,
              }
            : {
                status: "success",
                values: { ...this.fieldValues } as unknown as Data,
              };
      }

      if (result.status === "success") {
        this.fieldErrors = {};
        this.store.setState((s) => ({ ...s, errors: this.fieldErrors }));

        await onValid(result.values);
      } else {
        const errors = (this.fieldErrors = result.errors);

        this.store.setState((s) => ({
          ...s,
          errors,
        }));

        await onInvalid?.(result.errors);
      }

      this.store.setState((s) => ({
        ...s,
        status: "submitted",
        isSubmitted: true,
        isSubmitting: false,
        isSubmitSuccessful: Object.keys(this.fieldErrors).length === 0,
        submitCount: s.submitCount + 1,
        errors: this.fieldErrors,
      }));
    };
  }
}

function getInitialFormState(): FormStore {
  return {
    isLoading: true,
    isDirty: false,
    submitCount: 0,
    status: "submitPending",
    isSubmitting: false,
    isSubmitted: false,
    touchedFields: {},
    dirtyFields: {},
    errors: {},
  };
}

function getFieldValue({ ref, registerOptions }: RegisteredField<any>) {
  // if (_f.refs ? _f.refs.every((ref) => ref.disabled) : ref.disabled) {
  //   return;
  // }

  switch (ref.type) {
    case "file": {
      return ref.files;
    }
    default: {
      const value = ref.value;

      if (value === undefined || !registerOptions) return value;
      if ((registerOptions as RegisterOptions<number>).valueAsNumber) {
        return ref.valueAsNumber;
      }

      return value;
      // : valueAsDate && isString(value)
      // ? new Date(value)
      // : setValueAs
      // ? setValueAs(value)
      // : value;
    }
  }

  // if (isRadioInput(ref)) {
  //   return getRadioValue(ref).value;
  // }

  // if (isMultipleSelect(ref)) {
  //   return [...ref.selectedOptions].map(({ value }) => value);
  // }

  // if (isCheckBox(ref)) {
  //   return getCheckboxValue(_f.refs).value;
  // }
}

export type NativeFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[];

function getInputValue(input: HTMLInputElement) {
  return input.type === "checkbox" ? input.checked : input.value;
}

export function warning(cond: any, message: string): cond is true {
  if (cond) {
    if (typeof console !== "undefined") console.warn(message);

    try {
      throw new Error(message);
    } catch {}
  }

  return true;
}
