#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

SOURCE=
TARGET=
IGNORE=
IGNORE_TAGNAMES=

# Takes a value and assigns it to either SOURCE or TARGET as needed
get_input () {
  if [ -z "$SOURCE" ]; then
    SOURCE="$1"
  elif [ -z "$TARGET" ]; then
    TARGET="$1"
  fi
}


# Parse out arguments
while [ ! -z "$1" ]; do
  case $1 in
    --ignore-tagnames )
      IGNORE_TAGNAMES="--ignore-tagnames"
      ;;
    --ignore )
      shift
      IGNORE=$1;
      ;;
    * )
      get_input $1
      ;;
  esac
  shift
done

# Make sure we've got a well-formed command
if [ -z "$SOURCE" ] || [ -z "$TARGET" ]; then
  echo "Usage: $0 source_file target_directory [--ignore <comma separated list>]"
  exit 1;
fi


# Make sure we have node
if ! command -v node > /dev/null 2>&1; then
  echo "Node not found; please install node."
  exit 1;
fi


# Make sure the source file exists
if [ ! -f $1 ]; then
  echo "Could not find source file $1"
  exit 1;
fi


# Make sure the target directory is a directory
if [ ! -d $2 ]; then
  echo "Could not find target directory $2"
  exit 2;
fi

node $SCRIPT_DIR/index.js --source $SOURCE --ignore $IGNORE $IGNORE_TAGNAMES | xargs -I % grep -nIT "\<%\>" $TARGET -R --color

