function Security() {
    const items = [
        {
            icon: "🛡",
            title: "Background Checked",
            text: "All providers are verified",
        },
        {
            icon: "▣",
            title: "Secure Payments",
            text: "Your Payments are safe",
        },
        {
            icon: "▤",
            title: "Data Privacy",
            text: "Your Data is protected",
        },
        {
            icon: "♧",
            title: "24/7 Support",
            text: "We’re here to help",
        },
    ];

    return (
        <section className="security-section">
            <h2>Safe , Secure & Trusted</h2>

            <div className="security-container">
                {items.map((item) => (
                    <div className="security-item" key={item.title}>
                        <div className="security-icon">
                            {item.icon}
                        </div>

                        <h3>{item.title}</h3>

                        <p>{item.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Security;