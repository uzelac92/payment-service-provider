SHELL := /bin/bash

ROOT := $(shell pwd)
SERVICES := auth-service user-service merchant-service mid-service transaction-service
CMD := npm run dev

start:
	/usr/bin/osascript -e "tell application \"Terminal\" to activate" \
	                   -e "tell application \"Terminal\" to do script \"cd $(ROOT)/services/$(word 1,$(SERVICES)) && $(CMD)\""
	@$(foreach SVC,$(wordlist 2,999,$(SERVICES)), \
	/usr/bin/osascript -e "tell application \"System Events\" to keystroke \"t\" using command down" \
	                    -e "tell application \"Terminal\" to do script \"cd $(ROOT)/services/$(SVC) && $(CMD)\" in front window"; \
	sleep 0.2; )
	@echo "✅ All services launched in Terminal tabs."

