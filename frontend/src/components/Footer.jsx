function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} NewsAI. AI-generated news aggregation platform.</p>
        <p className="mt-2 text-gray-600">Built with the MERN stack — final year project.</p>
      </div>
    </footer>
  );
}

export default Footer;