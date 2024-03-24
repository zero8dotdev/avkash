const BillingSettings = () => {
  return (
    <div className="text-gray-700 flex flex-col justify-start items-start border-x border-y border-gray-400 p-4 rounded-md">
      <div className="flex flex-col gap-4">
        <h1 className="font-bold text-black text-2xl">Billing</h1>

          <p className="  w-auto">You currently have 6 users.</p>
          <p className=" w-auto ">You will be next billed <b>$100</b> on <b>Mar 29, 2024</b>.</p>
        </div>
      <button className="text-white bg-red-500 self-end p-1 rounded-lg">
        View billing details
      </button>
    </div>
  );
};

export default BillingSettings;
