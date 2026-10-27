import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from werkzeug.exceptions import HTTPException

from app.common import ApiError, api_error_handler
def create_app(test_config=None):
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")

    app = Flask(__name__)
    default_cors_origins = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )
    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "CHANGE_ME"),
        DATABASE_URL=os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root@localhost:3306/Smarthomes",
        ),
        CORS_ORIGINS=[
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", default_cors_origins).split(",")
            if origin.strip()
        ],
        MAX_CONTENT_LENGTH=6 * 1024 * 1024,
    )
    if test_config:
        app.config.update(test_config)

    engine = create_engine(
        app.config["DATABASE_URL"],
        pool_pre_ping=True,
    )
    app.extensions["database_engine"] = engine
    app.extensions["session_factory"] = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
    )
    app.register_error_handler(ApiError, api_error_handler)

    from app.routes.auth import auth_bp
    from app.routes.bookings import bookings_bp
    from app.routes.catalog import catalog_bp
    from app.routes.messages import messages_bp
    from app.routes.notifications import notifications_bp
    from app.routes.profiles import profiles_bp
    from app.routes.admin_providers import admin_providers_bp
    from app.routes.admin_verifications import admin_verifications_bp
    from app.routes.admin_users import admin_users_bp
    from app.routes.admin_analytics import admin_analytics_bp
    from app.routes.feedback import feedback_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(profiles_bp)
    app.register_blueprint(admin_providers_bp)
    app.register_blueprint(admin_verifications_bp)
    app.register_blueprint(admin_users_bp)
    app.register_blueprint(admin_analytics_bp)
    app.register_blueprint(feedback_bp)

    @app.after_request
    def add_cors_headers(response):
        origin = (request.headers.get("Origin") or "").strip()
        allowed_origins = app.config["CORS_ORIGINS"]
        if origin and (origin in allowed_origins or "*" in allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = (
                "*" if "*" in allowed_origins else origin
            )
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = (
                "Authorization, Content-Type"
            )
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers.add("Vary", "Origin")
        return response

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify(detail="Maximum ID image size is 5 MB."), 413

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify(detail="Not found"), 404

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(detail=error.description), error.code

    @app.errorhandler(Exception)
    def internal_server_error(error):
        app.logger.exception("Unhandled API error", exc_info=error)
        return jsonify(detail="Internal server error"), 500

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    return app
