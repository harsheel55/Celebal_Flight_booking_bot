
import FlightBot from "@/components/FlightBot";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-4">
            FlightBot
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent flight booking assistant. Search, compare, and book flights through simple conversation.
          </p>
        </div>
        <FlightBot />
      </div>
    </div>
  );
};

export default Index;
