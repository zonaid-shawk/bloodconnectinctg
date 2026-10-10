function About() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold text-red-600">ABOUT BLOODCONNECT</p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Connecting Donors With Those in Need
        </h1>

        <p className="mt-6 leading-8 text-gray-600">
          BloodConnect is a web-based blood donor registration and management
          system designed to make it easier to find suitable blood donors based
          on blood group and location.
        </p>

        <p className="mt-4 leading-8 text-gray-600">
          The system allows donors to register, maintain their profiles, manage
          their availability, and keep track of their donation history.
        </p>
      </div>
    </main>
  );
}

export default About;
