import bcrypt


def encrypt(password):
    password = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password, salt)
    return hashed_password.decode("utf-8")


def check(password, encrypted_password):
    password = password.encode("utf-8")
    encrypted_password = encrypted_password.encode("utf-8")
    return bcrypt.checkpw(password, encrypted_password)


if __name__ == "__main__":
    password = "password"
    encrypted_password = encrypt(password)
    print(encrypted_password)
    check_status = check(password, encrypted_password)
    print(check_status)
