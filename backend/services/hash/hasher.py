import bcrypt

__encoding = "utf-8"


def encrypt(password):
    password = password.encode(__encoding)
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password, salt)
    return hashed_password.decode(__encoding)


def check(password, encrypted_password):
    password = password.encode(__encoding)
    encrypted_password = encrypted_password.encode(__encoding)
    return bcrypt.checkpw(password, encrypted_password)


if __name__ == "__main__":
    password = "password"
    encrypted_password = encrypt(password)
    print(encrypted_password)
    check_status = check(password, encrypted_password)
    print(check_status)
