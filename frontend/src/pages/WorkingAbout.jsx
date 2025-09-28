import React, { useState } from 'react';

const WorkingAbout = () => {
  const [activeTab, setActiveTab] = useState('story');

  const teamMembers = [
    {
      name: 'Alex Rahman',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      bio: 'Sports enthusiast with 10+ years in tech. Built this platform to revolutionize sports booking.',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'Sarah Ahmed',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
      bio: 'Full-stack developer passionate about creating seamless user experiences.',
      social: { linkedin: '#', github: '#' }
    },
    {
      name: 'Mike Khan',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
      bio: 'Former sports facility manager, now ensuring smooth operations across all our partner venues.',
      social: { linkedin: '#', instagram: '#' }
    },
    {
      name: 'Lisa Chowdhury',
      role: 'UX Designer',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      bio: 'Design expert creating intuitive interfaces that make sports booking effortless.',
      social: { linkedin: '#', dribbble: '#' }
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Happy Users', icon: '👥' },
    { number: '1,200+', label: 'Partner Fields', icon: '🏟️' },
    { number: '25+', label: 'Sports Supported', icon: '⚽' },
    { number: '8+', label: 'Cities Covered', icon: '🏙️' }
  ];

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black premium-gradient-text mb-6">
            About Premium Sports 🏆
          </h1>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing how people discover, book, and enjoy sports facilities. 
            Built by sports lovers, for sports lovers.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="premium-card p-2">
            <div className="flex space-x-2">
              {[
                { id: 'story', label: '📖 Our Story', icon: '📖' },
                { id: 'mission', label: '🎯 Mission', icon: '🎯' },
                { id: 'team', label: '👥 Team', icon: '👥' },
                { id: 'values', label: '💎 Values', icon: '💎' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-16">
          
          {/* Our Story */}
          {activeTab === 'story' && (
            <div className="premium-card">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-6">📖 Our Story</h2>
                  <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                    <p>
                      It all started in 2020 when our founder, Alex Rahman, struggled to find and book 
                      a decent football field for his weekend games. The process was frustrating, 
                      time-consuming, and often resulted in disappointment.
                    </p>
                    <p>
                      That's when the idea struck: "What if there was a platform that made sports 
                      booking as easy as ordering food online?" With this vision, Premium Sports 
                      was born.
                    </p>
                    <p>
                      Today, we've partnered with over 1,200 sports facilities across Bangladesh, 
                      serving 50,000+ sports enthusiasts who share our passion for the game.
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <img 
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600" 
                    alt="Sports field" 
                    className="rounded-2xl shadow-2xl w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mission */}
          {activeTab === 'mission' && (
            <div className="premium-card text-center">
              <h2 className="text-4xl font-bold text-white mb-8">🎯 Our Mission</h2>
              <div className="max-w-4xl mx-auto">
                <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
                  To make sports accessible to everyone by providing a seamless platform 
                  for discovering, booking, and enjoying premium sports facilities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: '🚀',
                      title: 'Innovation',
                      description: 'Continuously improving technology to enhance user experience'
                    },
                    {
                      icon: '🤝',
                      title: 'Accessibility',
                      description: 'Making sports facilities available to people from all backgrounds'
                    },
                    {
                      icon: '🏆',
                      title: 'Excellence',
                      description: 'Partnering only with premium facilities that meet our high standards'
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-black/20 p-6 rounded-xl">
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {activeTab === 'team' && (
            <div className="premium-card">
              <h2 className="text-4xl font-bold text-white mb-8 text-center">👥 Meet Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <div key={index} className="text-center bg-black/20 p-6 rounded-xl">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                    <p className="text-purple-400 font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                    <div className="flex justify-center space-x-3">
                      {Object.entries(member.social).map(([platform, url]) => (
                        <button
                          key={platform}
                          onClick={() => alert(`${platform} profile would open here`)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {platform === 'linkedin' && '💼'}
                          {platform === 'twitter' && '🐦'}
                          {platform === 'github' && '💻'}
                          {platform === 'instagram' && '📸'}
                          {platform === 'dribbble' && '🎨'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          {activeTab === 'values' && (
            <div className="premium-card">
              <h2 className="text-4xl font-bold text-white mb-8 text-center">💎 Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: '🔒 Trust & Security',
                    description: 'We prioritize user data security and maintain transparent, honest relationships with our users and partners.'
                  },
                  {
                    title: '🌟 Quality First',
                    description: 'Every facility on our platform meets strict quality standards to ensure the best experience for our users.'
                  },
                  {
                    title: '🤝 Community Focus',
                    description: 'We believe sports bring people together and actively foster a supportive community of athletes.'
                  },
                  {
                    title: '💡 Continuous Innovation',
                    description: 'We constantly evolve our platform based on user feedback and emerging technologies.'
                  },
                  {
                    title: '🌍 Sustainability',
                    description: 'We partner with eco-friendly facilities and promote sustainable sports practices.'
                  },
                  {
                    title: '⚡ Speed & Efficiency',
                    description: 'We value your time and ensure our platform is fast, reliable, and easy to use.'
                  }
                ].map((value, index) => (
                  <div key={index} className="bg-black/20 p-6 rounded-xl">
                    <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="premium-card mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">📈 Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-black premium-gradient-text mb-2">{stat.number}</div>
                <div className="text-white font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="premium-card text-center">
          <h2 className="text-4xl font-bold text-white mb-6">🚀 Join Our Journey</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're a player looking for the perfect field or a facility owner 
            wanting to reach more customers, we'd love to have you on board.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/register'}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all"
            >
              🏟️ Start Booking
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold rounded-xl transition-all"
            >
              🤝 Partner With Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingAbout;