import type { SyntheticEvent } from 'react';

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
  imageAlt: string;
  linkedin: string;
  placeholder: string;
};

type Advisor = {
  name: string;
  expertise: string;
  bio?: string;
  image?: string;
  imageAlt?: string;
  placeholder?: string;
};

const teamMembers: TeamMember[] = [
  {
    name: 'Oliver Hitchings',
    role: 'Founder & Leads Hardware Design and Production',
    bio: 'Leads the technical vision, Electrical and aerospace engineering, as well as strategic direction of the company.',
    image: '/assets/OliverH.jpeg',
    imageAlt: 'Oliver Hitchings',
    linkedin: 'https://www.linkedin.com/in/oliver-hitchings-aa71a1176/',
    placeholder: '👨‍💼'
  },
  {
    name: 'Max Hitchings',
    role: 'Co-Founder & Lead Developer',
    bio: 'Builds internal tools supporting flight test data, dashboards, and AI flight control systems.',
    image: '/assets/MaxH.jpeg',
    imageAlt: 'Max Hitchings',
    linkedin: 'https://www.linkedin.com/in/max-hitchings-4694b5172/',
    placeholder: '👨‍💼'
  }
];

const advisors: Advisor[] = [
  {
    name: 'Jay Abbott',
    expertise: 'Software & Business Strategy',
    bio: 'Three decades of experience in software engineering and technology leadership. Advises on software and product delivery.',
    image: '/assets/jay.jpg',
    imageAlt: 'Jay Abbott',
    placeholder: '👨‍💼'
  },
  {
    name: 'Philip Hitchings',
    expertise: 'Sales & Customer Relations',
    bio: 'Three decades of experience in mobile telecoms. Leads sales initiatives and customer connections, providing both advisory and hands-on support.',
    image: '/assets/Phil.jpeg',
    imageAlt: 'Philip Hitchings',
    placeholder: '👨‍💼'
  },
  {
    name: '[inversor]',
    expertise: 'Venture Capital & Finance'
  }
];

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.style.display = 'none';
  const placeholder = image.nextElementSibling;
  if (placeholder instanceof HTMLElement) {
    placeholder.style.display = 'block';
  }
}

function LinkedinIcon() {
  return (
    <svg className="team-linkedin-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.473 0 16 .513 16 1.146v13.708c0 .633-.527 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zM4.943 13.5V6.169H2.542V13.5zm-1.2-8.333c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.341-1.248S2.4 3.21 2.4 3.919c0 .694.506 1.248 1.327 1.248zm9.74 8.333v-4.086c0-2.188-1.168-3.205-2.725-3.205-1.255 0-1.82.69-2.135 1.176v-1.01H6.542c.03.669 0 7.125 0 7.125h2.48V9.521c0-.213.016-.426.08-.578.173-.426.568-.867 1.232-.867.869 0 1.216.654 1.216 1.612V13.5z" />
    </svg>
  );
}

export default function TeamSection() {
  return (
    <div id="team" className="section-wrapper team-bg">
      <section className="section-container">
        <h2 className="section-title">Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div className="team-member" key={member.name}>
              <div className="team-photo-container">
                <img src={member.image} alt={member.imageAlt} className="team-photo" onError={handleImageError} />
                <div className="team-photo-placeholder" style={{ display: 'none' }}>
                  {member.placeholder}
                </div>
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-bio">{member.bio}</p>
              <a
                className="team-linkedin"
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} LinkedIn profile`}
                title="LinkedIn"
              >
                <LinkedinIcon />
              </a>
            </div>
          ))}
        </div>
        <h3 className="advisory-title">Advisory Board</h3>
        <div className="advisor-grid">
          {advisors.map((advisor) => (
            <div className="advisor-card" key={advisor.name}>
              {advisor.image ? (
                <div className="advisor-photo-container">
                  <img src={advisor.image} alt={advisor.imageAlt} className="advisor-photo" onError={handleImageError} />
                  <div className="advisor-photo-placeholder" style={{ display: 'none' }}>
                    {advisor.placeholder}
                  </div>
                </div>
              ) : null}
              <h4 className="advisor-name">{advisor.name}</h4>
              <p className="advisor-expertise">{advisor.expertise}</p>
              {advisor.bio ? <p className="advisor-bio">{advisor.bio}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
