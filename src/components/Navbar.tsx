export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="#" className="nav-logo">
          PHOTON AEROSPACE
        </a>
        <input type="checkbox" id="nav-toggle" className="nav-toggle" />
        <label htmlFor="nav-toggle" className="nav-toggle-label">
          <span></span>
        </label>
        <div className="nav-links">
          <a href="#technology">Technology</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#team">Team</a>
          <a href="#contact" className="nav-button">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}
