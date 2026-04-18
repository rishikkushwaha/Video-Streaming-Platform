import './Legal.css';

export default function About() {
  return (
    <div className="page-content legal-page">
      <div className="container fade-in">
        <div className="legal-content">
          <h1>About StreamFlix</h1>
          <p className="lead">
            We built StreamFlix to give creators a beautiful, fast, and secure platform to share their stories with the world.
          </p>
          
          <h2>Our Mission</h2>
          <p>
            To empower everyone to express themselves freely and connect with a global community through the power of video. 
            We believe in high-quality streaming, minimal design, and putting the creator first.
          </p>

          <h2>Why Us?</h2>
          <ul>
            <li><strong>Lightning Fast:</strong> Optimized global delivery.</li>
            <li><strong>Minimal Design:</strong> A clean UI that puts your content center stage.</li>
            <li><strong>Community Driven:</strong> Built for creators, by creators.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
