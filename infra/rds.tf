resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = [for s in aws_subnet.public : s.id]
}

resource "aws_security_group" "db" {
  name        = "${var.project}-db"
  description = "RDS Postgres — accepts traffic only from ECS tasks"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "db_from_tasks" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_tasks.id
  security_group_id        = aws_security_group.db.id
  description              = "Postgres from ECS tasks"
}

resource "aws_db_instance" "main" {
  identifier                 = "${var.project}-db"
  engine                     = "postgres"
  engine_version             = "16.4"
  instance_class             = var.db_instance_class
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = random_password.db.result
  db_subnet_group_name       = aws_db_subnet_group.main.name
  vpc_security_group_ids     = [aws_security_group.db.id]
  publicly_accessible        = false
  skip_final_snapshot        = true
  backup_retention_period    = 7
  deletion_protection        = false
  auto_minor_version_upgrade = true
  apply_immediately          = true

  lifecycle {
    ignore_changes = [password]
  }
}
