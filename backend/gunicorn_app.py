from flask import Flask
from apis import authentication, metadata, user, field, season, measurement, sse


app = Flask(__name__)
app.register_blueprint(authentication.api)
app.register_blueprint(metadata.api)
app.register_blueprint(user.api)
app.register_blueprint(field.api)
app.register_blueprint(season.api)
app.register_blueprint(measurement.api)
app.register_blueprint(sse.api)
