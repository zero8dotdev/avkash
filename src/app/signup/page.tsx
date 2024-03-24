import Image from "next/image";

export default function SignUp() {
  return (
    <div className="min-h-screen  flex flex-col justify-center items-center bg-gray-100">
      <h2 className="text-xl font-bold mb-4 ">Welcome to Avkash</h2>

      <div className="h-16 w-16 m-2">
        <Image
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACUCAMAAABY3hBoAAAAhFBMVEX/AGb/////AGL/AGD/AGT/AFz/AF7/AFr/AFf/AFT/s8v/AFL/n7z/9fn/WYj/+/3/6e//x9n/MHH/XI7/0+H/fKX/7vT/zd3/JnP/J2z/3uj/qcL/bJj/lbP/wdX/Nnj/dJz/QX7/SHr/Yo3/FGz/h6r/TIb/AEr/5fD/uc7/AD//jaug8cW3AAACxUlEQVR4nO3Z23KbMBAGYFYHjgaBkcHGYOwYE6jf//0qSOM4aabTi85IM/2/m2Ry9c9qtZKI5wEAAAAAAAAAAAAAAAAAwP9BcJ/ZzvAd3p93mXAumpCblIiK3rFkQsykijinyRO2szwT4YaqMkkGTRtpO8wTfpiJSpOIX5U+2E7zgfUNVW0SCo9dqmZrO84HNlOx9briIviZCttpntXq5ToR7Xweu9VjdRqnpDOPbUntHdqVfmwm2CZgXjhTHNpO84T1Wpfc7MlSpS8OFcyMsSjiyw8zxXzbWb4hd1Qxpwr2hu0ral0sGD9S4dgJvmIZpZdfwQTj3JlFDQvarKOCyXC4XMvLEAbcgQrylvLl+OZeOy8XMyOt79dB2i6cOFFnOl/22kSqdFHoyvyimm4IrJZNZJQPwvPPRM1tH0VJEkVDeVxSzpnNaOaiaA4j1is6Ht5XT3A5XM1plcZDYC1YkNPIPL+hzeunv7NkOJo17TxuJ5cYVHVYzspp+7XZhRxPRHprp2g8Iy083tHx99Ev/NeL6bXOt7E/ebkG26w78zlTkoh+bNuzSXa0sQXEXqmt+FKxwMvup4oetI2rWtRQF5kbf/1YLxnetVpG2VTPcTyfdB7buHTzK6k2GHIq37YfEzdTqyZu9zIJAyllGCV2HgPmpZTefnSkkzXnwezE4jwEVjr+M2lGaXOe1i7jfUpNG3L7qRb+LjdTntQ9FP1E+uDOM46LnV4uFmezE05ufY+SLLsXU3annDmVyzBXV/+lUqWlo/GPzJitAzfa/jN+UzQ7t5TectO5VlT3zj3k2Nh1hZkbo2s1Y83bkX1zZ46tWJZW3a4tR9fan99pjqTvzHP3gc90c67vF7wi1/4HsWIj5ZHtEN8JzO3apY+dD35NrYsrKfrKsa+w74aTlVfaXwjtfaYAAAAAAAAAAAAAAAAAAPjnfgKmBCM0vVmVeQAAAABJRU5ErkJggg=="
          alt="Logo"
          height={64}
          width={64}
          className="h-16 w-16"
        />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Sign-Up for Avkash</h2>
        <div className=" bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Caution:</p>
          <p>Is your organization using slack? Caution content goes here</p>
        </div>
        <form>
          <div className="mb-4">
            <label htmlFor="firstName" className="block mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="companyName" className="block mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1">
              Work Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full"
          >
            Sign Up
          </button>
        </form>
        <p>
          Already an account <span className="text-blue-500">Sign-In</span>
        </p>
      </div>
    </div>
  );
}
