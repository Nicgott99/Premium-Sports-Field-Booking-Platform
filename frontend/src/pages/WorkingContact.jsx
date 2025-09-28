import React, { useState } from 'react';

const WorkingContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'General Inquiry',
    'Booking Support',
    'Technical Issue',
    'Partnership',
    'Feedback',
    'Complaint',
    'Feature Request'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all required fields!');
      return;
    }

    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      alert(`Message Sent Successfully! 🎉\n\nThank you ${formData.name}!\nWe'll get back to you at ${formData.email} within 24 hours.\n\nReference ID: CS-${Date.now().toString().slice(-6)}\n\nCategory: ${formData.category}\nPriority: ${formData.priority.toUpperCase()}`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: '',
        priority: 'normal'
      });
      
      setLoading(false);
    }, 2000);
  };

  const contactMethods = [
    {
      icon: '📞',
      title: 'Phone Support',
      info: '+880-1711-SPORTS (776787)',
      subinfo: 'Mon-Fri: 9AM-9PM, Sat-Sun: 10AM-6PM',
      action: () => alert('Calling +880-1711-776787...')
    },
    {
      icon: '📧',
      title: 'Email Support',
      info: 'support@premiumsports.bd',
      subinfo: 'Response within 24 hours',
      action: () => alert('Opening email client...')
    },
    {
      icon: '💬',
      title: 'Live Chat',
      info: 'Chat with our support team',
      subinfo: 'Available 24/7',
      action: () => alert('Live chat feature would open here')
    },
    {
      icon: '📍',
      title: 'Visit Us',
      info: 'House 123, Road 4, Dhanmondi, Dhaka',
      subinfo: 'Open Mon-Fri: 9AM-6PM',
      action: () => alert('Opening Google Maps...')
    }
  ];

  const faqItems = [
    {
      question: 'How do I book a sports field?',
      answer: 'Simply browse our fields, select your preferred date and time, and confirm your booking. Payment can be made online or at the venue.'
    },
    {
      question: 'Can I cancel or reschedule my booking?',
      answer: 'Yes, you can cancel or reschedule up to 24 hours before your booking time through your dashboard or by contacting us.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bKash, Nagad, Rocket, credit/debit cards, and cash payments at partner venues.'
    },
    {
      question: 'How do I become a partner facility?',
      answer: 'Contact us through the partnership category in the form above, and our team will guide you through the onboarding process.'
    }
  ];

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black premium-gradient-text mb-6">
            📞 Contact Us
          </h1>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            We're here to help! Get in touch with our team for support, partnerships, 
            or any questions about our platform.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <div 
              key={index} 
              className="premium-card text-center cursor-pointer hover:transform hover:scale-105 transition-all"
              onClick={method.action}
            >
              <div className="text-4xl mb-4">{method.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{method.title}</h3>
              <p className="text-purple-400 font-semibold mb-2">{method.info}</p>
              <p className="text-gray-400 text-sm">{method.subinfo}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="premium-card">
              <h2 className="text-3xl font-bold text-white mb-8">📝 Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      👤 Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      📧 Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Phone and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      📱 Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      📋 Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-white font-semibold mb-2">
                      📌 Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief subject of your message"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      🚨 Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    💬 Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400 resize-vertical"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending Message...</span>
                    </div>
                  ) : (
                    '🚀 Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Business Hours */}
            <div className="premium-card">
              <h3 className="text-2xl font-bold text-white mb-6">🕒 Business Hours</h3>
              <div className="space-y-3">
                {[
                  { day: 'Monday - Friday', hours: '9:00 AM - 9:00 PM' },
                  { day: 'Saturday', hours: '10:00 AM - 8:00 PM' },
                  { day: 'Sunday', hours: '10:00 AM - 6:00 PM' },
                  { day: 'Public Holidays', hours: '10:00 AM - 4:00 PM' }
                ].map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                    <span className="text-gray-300">{schedule.day}</span>
                    <span className="text-white font-semibold">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="premium-card">
              <h3 className="text-2xl font-bold text-white mb-6">🚨 Emergency Support</h3>
              <p className="text-gray-300 mb-4">
                For urgent booking issues or facility emergencies during events:
              </p>
              <button
                onClick={() => alert('Calling emergency hotline...')}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all"
              >
                📞 Emergency Hotline
              </button>
              <p className="text-center text-gray-400 text-sm mt-2">Available 24/7</p>
            </div>

            {/* Social Media */}
            <div className="premium-card">
              <h3 className="text-2xl font-bold text-white mb-6">🌐 Follow Us</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700' },
                  { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
                  { name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-600' },
                  { name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-800' }
                ].map((social) => (
                  <button
                    key={social.name}
                    onClick={() => alert(`Opening ${social.name}...`)}
                    className={`p-3 bg-gradient-to-r ${social.color} text-white font-semibold rounded-lg transition-all hover:scale-105`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>{social.icon}</span>
                      <span className="text-sm">{social.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 premium-card">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">❓ Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-black/20 p-6 rounded-xl">
                <h4 className="text-lg font-bold text-white mb-3">{faq.question}</h4>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={() => alert('FAQ page would open with more questions and answers')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all"
            >
              📚 View All FAQs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingContact;