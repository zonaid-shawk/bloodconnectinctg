import SearchableDonorList from "../components/SearchableDonorList";

function FindDonor() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 transition-colors duration-200 dark:bg-gray-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <SearchableDonorList />
      </div>
    </main>
  );
}

export default FindDonor;
