function About() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-6">About NewsAI</h1>
        <p className="text-gray-300 text-lg leading-relaxed mb-4">
          NewsAI is an automated news aggregation platform that uses artificial
          intelligence to generate original, transformative summaries of current
          events across Geopolitics, Finance, Technology, and Sports.
        </p>
        <p className="text-gray-300 text-lg leading-relaxed mb-4">
          Rather than republishing copyrighted content, our system fetches raw
          headlines from public RSS feeds, then uses large language models to
          rewrite each story into a completely original summary, paired with a
          unique AI-generated thumbnail image.
        </p>
        <p className="text-gray-300 text-lg leading-relaxed">
          This project was built using the MERN stack (MongoDB, Express, React,
          Node.js) as a final year academic project, demonstrating a practical
          application of generative AI in automated content pipelines.
        </p>
      </div>
    </div>
  );
}

export default About;