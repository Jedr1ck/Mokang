import { useEffect, useState } from "react";
import { getPublicReviews } from "../../services/api";

function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [visibleCount, setVisibleCount] = useState(
        () => window.matchMedia("(max-width: 768px)").matches ? 1 : 3
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        const updateVisibleCount = (event) => {
            setVisibleCount(event.matches ? 1 : 3);
            setPage(0);
        };

        mediaQuery.addEventListener("change", updateVisibleCount);
        return () => mediaQuery.removeEventListener("change", updateVisibleCount);
    }, []);

    useEffect(() => {
        let active = true;

        getPublicReviews()
            .then((items) => {
                if (active) setReviews(items);
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError.message ||
                        "Customer reviews are temporarily unavailable."
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const pageCount = Math.ceil(reviews.length / visibleCount);
    const visibleReviews = reviews.slice(
        page * visibleCount,
        (page + 1) * visibleCount
    );

    return (
        <section className="reviews-section">
            <h2>What Our Users Say</h2>

            {loading ? (
                <p className="reviews-feedback-state" role="status">
                    Loading customer reviews...
                </p>
            ) : error ? (
                <p className="reviews-feedback-state" role="alert">{error}</p>
            ) : reviews.length ? (
                <div className="reviews-carousel">
                    <button
                        type="button"
                        className="reviews-carousel-arrow"
                        onClick={() => setPage((currentPage) => currentPage - 1)}
                        disabled={page === 0}
                        aria-label="Show previous reviews"
                    >
                        <i className="bi bi-chevron-left" aria-hidden="true"></i>
                    </button>

                    <div className="reviews-container">
                        {visibleReviews.map((review) => (
                            <article className="review-card" key={review.id}>
                                <div
                                    className="stars"
                                    aria-label={`${review.rating} out of 5 stars`}
                                >
                                    {"★".repeat(review.rating)}
                                    <span>{"☆".repeat(5 - review.rating)}</span>
                                </div>

                                <p>{review.comment}</p>

                                <div className="review-user">
                                    <strong>{review.homeownerName}</strong>
                                    <span>Homeowner · {review.service}</span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="reviews-carousel-arrow"
                        onClick={() => setPage((currentPage) => currentPage + 1)}
                        disabled={page >= pageCount - 1}
                        aria-label="Show more reviews"
                    >
                        <i className="bi bi-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            ) : (
                <p className="reviews-feedback-state">
                    No customer reviews have been shared yet.
                </p>
            )}
        </section>
    );
}

export default Reviews;