import { createForm, zodResolver } from "@brendonovich/solid-form";
import { createSignal } from "solid-js";
import { z } from "zod";

const schema = z.object({
  email: z.string(),
  count: z.number(),
});

function App() {
  const [native, setNative] = createSignal(true);

  const form = createForm({
    resolver: zodResolver(schema),
    get useNativeValidation() {
      return native();
    },
  });

  return (
    <div class="w-screen h-screen bg-neutral-900 text-white flex justify-center items-center">
      <form
        class="flex flex-col gap-2"
        onSubmit={form.handleSubmit(console.log)}
      >
        <button type="button" onClick={() => setNative((r) => !r)}>
          {native().toString()}
        </button>
        State: "{form.state.status}"
        <form.Register name="email" required>
          {(p) => <input class="text-black" type="text" {...p} />}
        </form.Register>
        <form.Register name="count" required valueAsNumber>
          {(p) => <input class="text-black" type="number" {...p} />}
        </form.Register>
        <pre>
          {Object.keys(form.state.errors).length > 0 &&
            JSON.stringify(form.state.errors, null, 4)}
        </pre>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;
