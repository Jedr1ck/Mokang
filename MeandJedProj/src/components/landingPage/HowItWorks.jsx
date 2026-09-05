function HowItWorks() {
    const steps = [
        {
            number: "01",
            title: "Search",
            description: "Find the home service you need.",
            icon: "⌕",
        },
        {
            number: "02",
            title: "Match",
            description: "We need you with suitable and verified service providers.",
            icon: "👥",
        },
        {
            number: "03",
            title: "Book",
            description: "Choose a provider and book your service online.",
            icon: "▣",
        },
        {
            number: "04",
            title: "Tract & Review",
            description: "Track your Booking and leave a review.",
            icon: "★",
        },
    ];

    return (
        <section id="how-it-works" className="how-section">
            <h2>How SmartHome Match Works</h2>

            <div className="steps-container">
                {steps.map((step, index) => (
                    <div className="step-wrapper" key={step.number}>
                        <div className="step">
                            <div className="step-icon">
                                {step.icon}
                            </div>

                            <h3>
                                <span>{step.number}</span>
                                {step.title}
                            </h3>

                            <p>{step.description}</p>
                        </div>

                        {index < steps.length - 1 && (
                            <div className="step-arrow">→</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

export default HowItWorks;