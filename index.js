var url = require('url')
  , async = require('async')
  , request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')

var q = async.queue(function(row, callback){
  var doc = src +  '/' + row.id;
  var to = row.dst + '/' + row.id
  console.log('running', doc)
  request.get(doc, {json: true, qs: {attachments: true}}, function(err, resp, body){
    delete body._rev;
    if (body._attachments) {
      var keys = Object.keys(body._attachments)
      keys.forEach(function(key){
        delete body._attachments[key].revpos
      })

    }
    request.put(to, {json: true, body: JSON.stringify(body)}, function(err, resp, body2){
      callback();
    })

  })


}, 1)


function copy(src, dst){
  var all_docs = src +  '/_all_docs';
  console.log(all_docs);
  var i = 0;
  request.get(all_docs)
    .pipe(JSONStream.parse('rows.*'))
    .pipe(es.mapSync(function (data) {
      console.log(i++);
      data.dst = dst;
      q.push(data);
    }))
    .on('end', function(){
      console.log('all done', i)
    })
}


var src = process.argv[2],
    dst = process.argv[3];

console.log('copy from ', src, 'to', dst);
copy(src, dst);