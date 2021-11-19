resource "aws_iam_role" "janitor" {
  name               = var.name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  permissions_boundary = var.boundary_policy
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "janitor" {
  name                 = "Lambda-Actions"
  role                 = aws_iam_role.janitor.id
  policy               = data.aws_iam_policy_document.janitor.json
}

data "aws_iam_policy_document" "janitor" {
  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid = "LambdaActions"
    actions = [
      "lambda:ListFunctions",
      "lambda:ListAliases",
      "lambda:ListVersionsByFunction",
      "lambda:DeleteFunction",
    ]
    resources = ["*"]
  }
}