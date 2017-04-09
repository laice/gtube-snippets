// modular goontube client

const WebSocketClient = require('websocket').client;
const crypto = require('crypto');

class GOONTUBE_CLIENT {
  // host is an object or class that implements the functions
  // on lines 199 - 255
  constructor(username, password, host, callback) {
    this.client = new WebSocketClient();
    this.gt_u = username;
    this.host = host;

    let hash = crypto.createHash('md5');
    hash.update(password);
    this.gt_p = hash.digest('hex').toString();

    console.log(`[GOONTUBE_CLIENT]`,`user ${this.gt_u}`, `pass ${this.gt_p}` );

    this.connect_callback = callback;

    this.is_joined = false;

    this.send_queue = [];

    this.msg_interval = 1500;

    this.connect();
  }

  disconnect() {
    this.socket.close();
  }

  connect() {
    let client = this.client;
    let c = 'wss://goontu.be:7786';
    console.log(c);
    client.connect(c, null, null, null);

    client.on('connect', this.on_connect.bind(this));
    client.on('connectFailed', this.on_connect_failed.bind(this));
    client.on('httpResponse', this.on_http_response.bind(this));
  }

  on_connect(socket) {
    console.log(`[GOONTUBE_CLIENT] Connected.`);
    this.socket = socket;

    this.send_login();
    this.send_idle();
    if(this.connect_callback) {
      this.connect_callback(this);
    }
    this.send_msg_interval = setInterval(() => { this.send_message() }, this.msg_interval);

    socket.on('message', this.on_socket_message.bind(this));
    socket.on('error', this.on_socket_error.bind(this));
    socket.on('close', this.on_socket_close.bind(this));

  }

  on_connect_failed(e) {
    console.error('[GOONTUBE_CLIENT] Client connect failed.', e);
  }

  on_http_response(response, socket) {
    console.log('[GOONTUBE_CLIENT] HTTP RESPONSE', response.toString());
  }

  on_socket_message(message) {

    let data = JSON.parse(message.utf8Data)[0];

    this.rcv_data(data);
  }
  on_socket_error(error) {
    console.error('[GOONTUBE_CLIENT] Socket error:', error);
  }
  on_socket_close(reasonCode, description) {
    console.log('[GOONTUBE_CLIENT] Socket closed. Code: ', reasonCode, ' Desc: ', description);
  }
  queue_msg(msg_obj) {
    this.send_queue.push(JSON.stringify(msg_obj));
  }

  unqueue_msg() {
    if(this.send_queue.length > 0) {
      return this.send_queue.shift();
    }
  }
  send_message() {
    if(this.socket) {
      if(this.send_queue.length > 0) {
        let nmsg = this.unqueue_msg();
        this.socket.sendUTF(nmsg);
      }
    }
  }
  send_login() {
    this.queue_msg({
      "type": 1,
      "gt_u": this.gt_u,
      "gt_p": this.gt_p
    });
  }

  send_idle() {
    this.queue_msg({
      "type": 15
    });
  }


  send_chat(message){
    if(message) {
      this.queue_msg({
        "type": 5,
        "message": message
      });
    }
  }

  send_quote(quote) {
    if(quote){
      let str = `${quote.author}: ${quote.quote}`;
      this.send_chat(str);
    }
  }
  send_whisper(target, message) {
    let str = `$w ${target} ${message}`;
    this.queue_msg({
      "type": 5,
      "message": str
    });
  }
  send_skip() {
    this.queue_msg({
      "type": 21,
      "val": 1
    });
  }
  send_video(link) {
    this.queue_msg({
      "type": 10,
      "new_vid": link
    });
  }
  send_remove(playlist_number) {
    //console.log(this.my_vids);
    this.queue_msg({
      "type": 35,
      "vid": parseInt(playlist_number)
    });
  }

  rcv_data(data) {
    console.log('data', data.type);


    switch(data.type){
      case 3:
        this.rcv_playlist(data);
        break;
      case 4:
        this.rcv_current_time(data);
        break;
      case 5:
        this.rcv_maint_msg(data);
        break;
      case 6:
        this.rcv_play_new_vid(data);
        break;
      case 7:
        this.rcv_chat(data);
        break;
      case 71:
        this.rcv_whisper(data);
        break;
      case 8:
        this.rcv_userlist(data);
        break;
      case 9:
      case 100:
        this.rcv_disconnect(data);
        break;
      case 30:
        this.rcv_poll(data);
        break;
      case 'SERVER_SETTINGS_PUSH':
        this.is_joined = true;
        break;

    }

  }

// host functions

  rcv_playlist(data) {
    this.host.rcv_playlist(data);
  }
  rcv_current_time(data){
    this.host.rcv_current_time(data);
  }
  rcv_maint_msg(data){
    this.host.rcv_maint_msg(data);
  }
  rcv_play_new_vid(data){
    this.host.rcv_play_new_vid(data);
  }
  rcv_chat(data) {
    this.host.rcv_chat(data);
  }
  rcv_whisper(data) {
    this.host.rcv_whisper(data);
  }
  rcv_poll(data) {
    this.host.rcv_poll(data);
  }
  rcv_userlist(data) {
    this.host.rcv_userlist(data);
  }
  rcv_disconnect(data) {
    this.host.rcv_disconnect(data);
  }


}

module.exports = GOONTUBE_CLIENT;
