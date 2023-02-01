import {
  Form,
  FormData,
  FormOptions,
  RegisterOptions,
} from "@brendonovich/form";
import { useStore } from "@tanstack/react-store";
import * as React from "react";

export * from "@brendonovich/form";

type ReactForm = ReturnType<typeof useForm>;

export const formContext = React.createContext<ReactForm | null>(null);

export function useFormContext(): ReactForm {
  const ctx = React.useContext(formContext);

  if (ctx === null)
    throw new Error("useForm must be used inside a <FormProvider> component!");

  useStore(ctx.form.store);

  return ctx;
}

export function useForm<
  Data extends FormData = FormData,
  Input extends FormData = Data
>(options?: FormOptions<Data, Input>) {
  const { current: form } = React.useRef(new Form<Data, Input>(options));

  type F = typeof form;

  const methods = React.useMemo(() => {
    return {
      register: <Key extends keyof Input & string>(
        key: Key,
        options?: RegisterOptions<Data[Key]>
      ): React.ComponentProps<"input"> => {
        let { onInput, ...props } = form.register(key, options);

        return {
          ...props,
          onInput: (e) => onInput(e.nativeEvent as InputEvent),
        };
      },
      handleSubmit: (
        ...args: Parameters<F["handleSubmit"]>
      ): React.FormEventHandler<any> => {
        const handler = form.handleSubmit(...args);

        return (e) => {
          e.stopPropagation();
          e.persist();

          handler(e.nativeEvent);
        };
      },
    };
  }, []);

  return {
    ...methods,
    form,
    state: useStore(form.store),
  };
}
