import subprocess

if __name__ == "__main__":
	subprocess.run(["pylint", "--disable=no-member,missing-module-docstring,broad-exception-caught,missing-function-docstring", "server/timetracker/*.py"])
