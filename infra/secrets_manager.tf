resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.project}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL = format(
      "postgres://%s:%s@%s:%d/%s",
      var.db_username,
      random_password.db.result,
      aws_db_instance.main.address,
      aws_db_instance.main.port,
      var.db_name,
    )
    ALPACA_KEY_ID     = var.alpaca_key_id
    ALPACA_SECRET_KEY = var.alpaca_secret_key
    ALPACA_BASE_URL   = var.alpaca_base_url
  })
}
