import { useForm, zodResolver } from "@brendonovich/react-form";
import { z } from "zod";

const schema = z.object({
  email: z.string(),
  count: z.number(),
});

function App() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <div className="w-screen h-screen bg-neutral-900 text-white flex justify-center items-center">
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(
          () => {}
          // async (data) => console.log(data),
          // async (error) => console.log(error)
        )}
      >
        State: "{form.state.status}"
        <input
          className="text-black"
          type="text"
          {...form.register("email", {
            required: true,
          })}
        />
        <input
          className="text-black"
          type="number"
          {...form.register("count", {
            required: true,
            valueAsNumber: true,
          })}
        />
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
