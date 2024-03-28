import WithSlack from "./withSlack";

export default function Login() {
  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="text-center">
        <h1 className="font-bold mb-2">Sign in to Avkash</h1>
        <WithSlack />
      </div>
    </div>
  );
}
