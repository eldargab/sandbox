cd "$(dirname ${BASH_SOURCE[0]})"
cd ..
P="$(pwd)"
export PATH=$P/node_modules/.bin:$P/scripts:$PATH
export NODE_PATH=$P/node_modules:$NODE_PATH
