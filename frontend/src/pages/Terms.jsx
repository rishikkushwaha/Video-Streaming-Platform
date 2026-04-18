import './Legal.css';

export default function Terms() {
  return (
    <div className="page-content legal-page">
      <div className="container fade-in">
        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: April 2026</p>
          
          <p>
            Welcome to StreamFlix. By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>

          <h2>User Conduct</h2>
          <p>
            You agree not to use the platform to:
          </p>
          <ul>
            <li>Upload content that infringes on any intellectual property rights.</li>
            <li>Distribute spam or malicious software.</li>
            <li>Engage in harassment or hate speech.</li>
          </ul>

          <h2>Content Ownership</h2>
          <p>
            You retain all ownership rights to the content you upload. However, by uploading, you grant us a worldwide, non-exclusive, royalty-free license to host and display it on StreamFlix.
          </p>
        </div>
      </div>
    </div>
  );
}
