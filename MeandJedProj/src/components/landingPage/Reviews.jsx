function Reviews() {
    const reviews = [
        {
            name: "Francisco Andrade",
            role: "HomeOwner",
            text: "SmartHome Service Match it so easy to find a plumber. The service was Excellent",
        },
        {
            name: "Kylie Petrakis",
            role: "HomeOwner",
            text: "This App is highly recomended",
        },
        {
            name: "Richard Sanchez",
            role: "Service Provider",
            text: "I get More bookings now and can manage my schedule efficiently",
        },
    ];

    return (
        <section className="reviews-section">
            <h2>What Our Users Say</h2>

            <div className="reviews-container">
                {reviews.map((review) => (
                    <div className="review-card" key={review.name}>
                        <div className="stars">★★★★★</div>

                        <p>{review.text}</p>

                        <div className="review-user">
                            <strong>{review.name}</strong>
                            <span>{review.role}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Reviews;