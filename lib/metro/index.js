var stations = require('./stations.json')

var m = module.exports = Object.keys(stations).sort()

m.info = function (st) {
  return stations[st]
}

m.line = function (st) {
  return stations[st] && stations[st].line
}

m.exists = function (st) {
  return !!stations[st]
}

m.lines = m.reduce(function (lines, line) {
  if (!~lines.indexOf(line)) lines.push(line)
  return lines
} , []).sort()

