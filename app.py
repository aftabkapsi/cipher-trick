from flask import Flask, render_template, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import base64


app = Flask(__name__)

# =========================================================
# SECURITY CONFIGURATION
# =========================================================

app.config.update(
    DEBUG=False,
    MAX_CONTENT_LENGTH=64 * 1024,
    TRUSTED_HOSTS=[
        "localhost",
        "127.0.0.1",
    ],
)


# =========================================================
# LIMITER CONFIGURATION
# =========================================================

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per hour"],
    storage_uri="memory://"
)



# =========================================================
# SECURITY HEADERS
# =========================================================

@app.after_request
def add_security_headers(response):

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), "
        "payment=(), usb=()"
    )

    # Basic CSP compatible with the current CDN-based frontend.
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "font-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none';"
    )

    return response


# =========================================================
# VALIDATION HELPERS
# =========================================================

MAX_TEXT_LENGTH = 10000
MAX_KEY_LENGTH = 100
MAX_MATRIX_VALUE = 1000000


def validate_text(text):

    if not isinstance(text, str):
        raise ValueError("Invalid text input.")

    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(
            f"Text is too long. Maximum is {MAX_TEXT_LENGTH} characters."
        )

    return text


def validate_key(key, name="keyword"):

    if not isinstance(key, str):
        raise ValueError(f"Invalid {name}.")

    if len(key) > MAX_KEY_LENGTH:
        raise ValueError(
            f"{name.capitalize()} is too long."
        )

    return key


def validate_matrix_value(value):

    try:
        value = int(value)
    except (TypeError, ValueError):
        raise ValueError("Hill matrix values must be integers.")

    if abs(value) > MAX_MATRIX_VALUE:
        raise ValueError(
            "Hill matrix values are too large."
        )

    return value


# =========================================================
# CAESAR CIPHER
# =========================================================

def caesar_cipher(text, shift):

    result = ""

    for char in text:

        if char.isalpha() and char.isascii():

            base = ord("A") if char.isupper() else ord("a")

            result += chr(
                (ord(char) - base + shift) % 26 + base
            )

        else:
            result += char

    return result


# =========================================================
# VIGENERE CIPHER
# =========================================================

def vigenere_cipher(text, key, decrypt=False):

    key = "".join(
        c for c in key.upper()
        if c.isalpha() and c.isascii()
    )

    if not key:
        raise ValueError(
            "Please enter a keyword containing letters."
        )

    result = []
    key_index = 0

    for char in text:

        if char.isalpha() and char.isascii():

            key_shift = (
                ord(key[key_index % len(key)])
                - ord("A")
            )

            if decrypt:
                key_shift = -key_shift

            base = (
                ord("A")
                if char.isupper()
                else ord("a")
            )

            result.append(
                chr(
                    (ord(char) - base + key_shift) % 26
                    + base
                )
            )

            key_index += 1

        else:
            result.append(char)

    return "".join(result)


# =========================================================
# PLAYFAIR CIPHER
# =========================================================

def build_playfair_matrix(key):

    key = "".join(
        c for c in key.upper()
        if c.isalpha() and c.isascii()
    )

    key = key.replace("J", "I")

    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"

    sequence = ""

    for char in key + alphabet:

        if char not in sequence:
            sequence += char

    return [
        sequence[i:i + 5]
        for i in range(0, 25, 5)
    ]


def playfair_positions(matrix):

    positions = {}

    for row in range(5):

        for col in range(5):

            positions[matrix[row][col]] = (
                row,
                col
            )

    return positions


def prepare_playfair_plaintext(text):

    text = "".join(
        c for c in text.upper()
        if c.isalpha() and c.isascii()
    )

    text = text.replace("J", "I")

    pairs = []
    i = 0

    while i < len(text):

        first = text[i]

        if i + 1 >= len(text):

            pairs.append(first + "X")
            i += 1

        elif text[i] == text[i + 1]:

            pairs.append(first + "X")
            i += 1

        else:

            pairs.append(
                first + text[i + 1]
            )

            i += 2

    return pairs


def prepare_playfair_ciphertext(text):

    text = "".join(
        c for c in text.upper()
        if c.isalpha() and c.isascii()
    )

    text = text.replace("J", "I")

    if len(text) % 2 != 0:

        raise ValueError(
            "Playfair ciphertext must contain an even number of letters."
        )

    return [
        text[i:i + 2]
        for i in range(0, len(text), 2)
    ]


def playfair_process(text, key, decrypt=False):

    key = "".join(
        c for c in key.upper()
        if c.isalpha() and c.isascii()
    )

    if not key:

        raise ValueError(
            "Please enter a Playfair keyword."
        )

    matrix = build_playfair_matrix(key)
    positions = playfair_positions(matrix)

    if decrypt:

        pairs = prepare_playfair_ciphertext(text)
        direction = -1

    else:

        pairs = prepare_playfair_plaintext(text)
        direction = 1

    result = []

    for first, second in pairs:

        r1, c1 = positions[first]
        r2, c2 = positions[second]

        # Same row
        if r1 == r2:

            result.append(
                matrix[r1][(c1 + direction) % 5]
            )

            result.append(
                matrix[r2][(c2 + direction) % 5]
            )

        # Same column
        elif c1 == c2:

            result.append(
                matrix[(r1 + direction) % 5][c1]
            )

            result.append(
                matrix[(r2 + direction) % 5][c2]
            )

        # Rectangle
        else:

            result.append(
                matrix[r1][c2]
            )

            result.append(
                matrix[r2][c1]
            )

    return "".join(result)


# =========================================================
# HILL CIPHER
# =========================================================

def mod_inverse(number, modulus):

    number %= modulus

    for value in range(1, modulus):

        if (number * value) % modulus == 1:
            return value

    return None


def hill_inverse_matrix(matrix):

    a, b = matrix[0]
    c, d = matrix[1]

    determinant = (
        a * d - b * c
    ) % 26

    inverse_determinant = mod_inverse(
        determinant,
        26
    )

    if inverse_determinant is None:

        raise ValueError(
            "This matrix cannot be inverted modulo 26. "
            "Try another matrix."
        )

    return [

        [
            (d * inverse_determinant) % 26,
            (-b * inverse_determinant) % 26
        ],

        [
            (-c * inverse_determinant) % 26,
            (a * inverse_determinant) % 26
        ]

    ]


def hill_transform(text, matrix):

    clean = "".join(
        c for c in text.upper()
        if c.isalpha() and c.isascii()
    )

    if not clean:
        return ""

    if len(clean) % 2 != 0:
        clean += "X"

    result = []

    for i in range(0, len(clean), 2):

        x = ord(clean[i]) - ord("A")
        y = ord(clean[i + 1]) - ord("A")

        first = (
            matrix[0][0] * x +
            matrix[0][1] * y
        ) % 26

        second = (
            matrix[1][0] * x +
            matrix[1][1] * y
        ) % 26

        result.append(
            chr(first + 65)
        )

        result.append(
            chr(second + 65)
        )

    return "".join(result)


def hill_process(text, matrix, decrypt=False):

    if decrypt:
        matrix = hill_inverse_matrix(matrix)

    return hill_transform(
        text,
        matrix
    )


# =========================================================
# BASE64
# =========================================================

def base64_process(text, decrypt=False):

    if decrypt:

        try:

            decoded = base64.b64decode(
                text.encode("utf-8"),
                validate=True
            )

            return decoded.decode("utf-8")

        except Exception:

            raise ValueError(
                "Invalid Base64 input."
            )

    return base64.b64encode(
        text.encode("utf-8")
    ).decode("utf-8")


# =========================================================
# ROUTES
# =========================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


@app.route("/process", methods=["POST"])
@limiter.limit("30 per minute")
def process():

    # Reject requests that aren't JSON.
    if not request.is_json:

        return jsonify({
            "error": "Request must use JSON."
        }), 415

    data = request.get_json(
        silent=True
    )

    if not isinstance(data, dict):

        return jsonify({
            "error": "Invalid request."
        }), 400

    text = data.get("text", "")
    cipher = data.get("cipher", "caesar")
    mode = data.get("mode", "encrypt")

    try:

        # -------------------------------------------------
        # Basic validation
        # -------------------------------------------------

        text = validate_text(text)

        allowed_ciphers = {
            "caesar",
            "vigenere",
            "playfair",
            "hill",
            "base64"
        }

        if cipher not in allowed_ciphers:

            raise ValueError(
                "Unknown cipher selected."
            )

        if mode not in {
            "encrypt",
            "decrypt"
        }:

            raise ValueError(
                "Invalid operation."
            )


        # -------------------------------------------------
        # Caesar
        # -------------------------------------------------

        if cipher == "caesar":

            shift = int(
                data.get("shift", 3)
            )

            if not 0 <= shift <= 25:

                raise ValueError(
                    "Shift must be between 0 and 25."
                )

            if mode == "decrypt":
                shift = -shift

            result = caesar_cipher(
                text,
                shift
            )


        # -------------------------------------------------
        # Vigenere
        # -------------------------------------------------

        elif cipher == "vigenere":

            key = validate_key(
                data.get("key", "")
            )

            result = vigenere_cipher(
                text,
                key,
                decrypt=(mode == "decrypt")
            )


        # -------------------------------------------------
        # Playfair
        # -------------------------------------------------

        elif cipher == "playfair":

            key = validate_key(
                data.get("key", "")
            )

            result = playfair_process(
                text,
                key,
                decrypt=(mode == "decrypt")
            )


        # -------------------------------------------------
        # Hill
        # -------------------------------------------------

        elif cipher == "hill":

            matrix = [

                [
                    validate_matrix_value(
                        data.get("a", 3)
                    ),

                    validate_matrix_value(
                        data.get("b", 3)
                    )
                ],

                [
                    validate_matrix_value(
                        data.get("c", 2)
                    ),

                    validate_matrix_value(
                        data.get("d", 5)
                    )
                ]

            ]

            result = hill_process(
                text,
                matrix,
                decrypt=(mode == "decrypt")
            )


        # -------------------------------------------------
        # Base64
        # -------------------------------------------------

        elif cipher == "base64":

            result = base64_process(
                text,
                decrypt=(mode == "decrypt")
            )


        return jsonify({
            "result": result
        })


    except (ValueError, TypeError):

        return jsonify({
            "error": "Invalid input. Please check your cipher settings."
        }), 400


    except Exception:

        # Do not expose internal exception details.
        app.logger.exception(
            "Unexpected error while processing request"
        )

        return jsonify({
            "error": "An unexpected server error occurred."
        }), 500


# =========================================================
# ERROR HANDLERS
# =========================================================

@app.errorhandler(413)
def request_too_large(error):

    return jsonify({
        "error": "Request is too large."
    }), 413


@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "Resource not found."
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({
        "error": "Method not allowed."
    }), 405


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "error": "Internal server error."
    }), 500

@app.errorhandler(429)
def rate_limit_exceeded(error):

    return jsonify({
        "error": "Too many requests. Please wait a moment and try again."
    }), 429


# =========================================================
# DEVELOPMENT SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )