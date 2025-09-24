
const Contacts = () => {
  return (
    <div className="flex flex-col w-[1400px] items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-800 mt-6 mb-4">Let's Connect</h1>
      <p className="text-center text-gray-600 mb-8">Choose your preferred way to reach out. I'm always open to new opportunities, collaborations, or just a friendly conversation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-600 max-w-6xl">
        <a href="https://www.linkedin.com/in/citiz-shrestha-00805b249/" target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-4  rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-blue-700">LinkedIn</h3>
          <p className="text-gray-600">Connect with me professionally and explore my career journey.</p>
          <p className="text-blue-500 mt-2">@citiz-shrestha</p>
        </a>
        <a href="https://github.com/Citizshrestha" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-gray-800">GitHub</h3>
          <p className="text-gray-600">Explore my repositories and coding projects.</p>
          <p className="text-gray-800 mt-2">@Citizshrestha</p>
        </a>
        <a href="https://www.instagram.com/citizshresthaa/?next=%2F" target="_blank" rel="noopener noreferrer" className="bg-pink-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-pink-700">Instagram</h3>
          <p className="text-gray-600">Follow my visual journey and creative moments.</p>
          <p className="text-pink-500 mt-2">@citizshresthaa</p>
        </a>
        <a href="https://www.facebook.com/citiz.shrestha.5/" target="_blank" rel="noopener noreferrer" className="bg-green-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-green-700">Facebook</h3>
          <p className="text-gray-600">Let's chat about projects, ideas, or collaborations!</p>
          <p className="text-green-500 mt-2">@citiz.shrestha.5</p>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <a href="mailto:citizshrestha@example.com" className="bg-blue-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="data:image/png;base64,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" alt="Email" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-blue-700">Send Email</h3>
          <p className="text-gray-600">Reach out via email for professional inquiries</p>
        </a>
        <a href="https://t.me/CitizShrestha" target="_blank" rel="noopener noreferrer" className="bg-green-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Direct Message" className="w-12 h-12 mb-2" />
          <h3 className="text-lg font-semibold text-green-700">Direct Message</h3>
          <p className="text-gray-600">Send me a direct message for quick responses</p>
        </a>
      </div>
    </div>
  );
};

export default Contacts;