export default function Login() {
  return(
    <div className="flex  justify-center items-center min-h-screen" >
      <div className="text-center space-x-3">
      <h1 className="font-bold">Sign in to Avkash</h1>
      <button className="w-72 rounded-md m-4 p-1 bg-pink-700" >Sign in with Slack</button><br/>
      <button className="w-72 rounded-md p-1 bg-green-800">Sign in with Email</button>
      </div>
    </div>
  )
}
