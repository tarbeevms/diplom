ifeq ($(CI_PROJECT_NAME	),)
CI_PROJECT_NAME=diplom
endif

build:  ## Build the binary file
	CGO_ENABLED=0 go build -o ./bin/$(CI_PROJECT_NAME) ./cmd/$(CI_PROJECT_NAME)