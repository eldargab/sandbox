test:
	@DB_CONNECTION_STRING="localhost/realty-test" mocha -R spec

test-debug:
	@DB_CONNECTION_STRING="localhost/realty-test" mocha debug -R spec

.PHONY: test test-debug
