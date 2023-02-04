import {
  Form,
  FormData,
  FormOptions,
  RegisterOptions,
} from "@brendonovich/form";
import * as Solid from "solid-js";
import { createMemo } from "solid-js";
// remove once `@tanstack/solid-store` is available
import { useStore } from "./solidStore";

export * from "@brendonovich/form";

type SolidForm = ReturnType<typeof createForm>;

export const formContext = Solid.createContext<SolidForm | null>(null);

export function useFormContext(): SolidForm {
  const ctx = Solid.useContext(formContext);

  if (ctx === null)
    throw new Error("useForm must be used inside a <FormProvider> component!");

  return ctx;
}

export function createForm<
  Data extends FormData = FormData,
  Input extends FormData = Data
>(options?: FormOptions<Data, Input>) {
  const form = new Form<Data, Input>(options);

  type F = typeof form;

  return {
    Register: <Key extends keyof Input & string>(
      props: RegisterOptions<Data[Key]> & { name: Key } & {
        children: (props: Solid.ComponentProps<"input">) => JSX.Element;
      }
    ) => (
      <>
        {props.children(
          // NOTE: This call is what enables reactivity via getters
          form.register(props.name, {
            ...props,
          })
        )}
      </>
    ),
    register: <Key extends keyof Input & string>(
      key: Key,
      options?: RegisterOptions<Data[Key]>
    ): Solid.ComponentProps<"input"> => form.register(key, options),
    handleSubmit: (
      ...args: Parameters<F["handleSubmit"]>
    ): Solid.ComponentProps<"form">["onSubmit"] => {
      const handler = form.handleSubmit(...args);

      return (e) => {
        e.stopPropagation();

        handler(e);
      };
    },
    form,
    state: useStore(form.store),
  };
}
