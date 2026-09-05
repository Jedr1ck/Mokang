function About() {
    const features = [
        {
            icon: "01",
            title: "Verification Providers",
            text: "All service providers go through a strict verification process",
        },
        {
            icon: "02",
            title: "Easy & Fast",
            text: "Find the right service quickly without the hassle of searching",
        },
        {
            icon: "03",
            title: "Easy Booking",
            text: "Book services online and manage everything in one place",
        },
        {
            icon: "04",
            title: "Easy Communication",
            text: "Chat directly and communicate with your service provider in app",
        },
    ];

    return (
        <section id="about" className="about-section">
            <div className="section-eyebrow">The SmartHome standard</div>
            <h2>Confidence in every booking</h2>
            <p className="about-intro">
                A simpler way to connect with skilled, trusted professionals for the work your home needs.
            </p>

            <div className="feature-container">
                {features.map((feature) => (
                    <div className="feature-card" key={feature.title}>
                        <div className="feature-number">
                            {feature.icon}
                        </div>

                        <h3>{feature.title}</h3>

                        <p>{feature.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default About;