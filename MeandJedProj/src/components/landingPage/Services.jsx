import { useState } from "react";

function Services() {
    const services = [
        "Plumbing",
        "Electrical",
        "Aircon Services",
        "Cleaning",
        "Carpentry",
        "Painting",
        "Gardening",
        "cctv installation",
    ];
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedService, setSelectedService] = useState("");

    const visibleServices = services.filter((service) => {
        const matchesSearch = service.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSelection = !selectedService || service === selectedService;
        return matchesSearch && matchesSelection;
    });

    return (
        <section id="services" className="services-section">
            <h2>What Service Do You Need</h2>

            <div className="service-search">
                <label className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        placeholder="Search for a service..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        aria-label="Search for a service"
                    />
                </label>

                <label className="service-select">
                    <select
                        value={selectedService}
                        onChange={(event) => setSelectedService(event.target.value)}
                        aria-label="Select a service"
                    >
                        <option value="">All services</option>
                        {services.map((service) => (
                            <option value={service} key={service}>{service}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="service-grid">
                {visibleServices.map((service) => (
                    <div className="service-card" key={service}>
                        <div className="service-image"></div>
                        <p>{service}</p>
                    </div>
                ))}

                {visibleServices.length === 0 && (
                    <p className="service-empty">No services found. Try another search.</p>
                )}
            </div>

            {(searchTerm || selectedService) && (
                <button
                    className="clear-service-filter"
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        setSelectedService("");
                    }}
                >
                    Clear filters
                </button>
            )}
        </section>
    );
}

export default Services;