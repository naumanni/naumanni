# What is Naumanni?

Naumanni(ナウマン)は、マストドン専用のWebユーザーインタフェースです。
マストドンと同様にDockerイメージから手軽に起動でき、誰でも設置できる自由なソフトウェアです。
複数インスタンスを横断的に管理でき、より使いやすいSMSライクなダイレクトメッセージ機能を備えているほか、将来的にはAIやエンドツーエンドの暗号化機能を備えることを目標としています。

![Screenshot](screenshot.png)


# Version

0.1.1 (αリリース)

現在 Naumanniはα版です。不具合、足りない機能などいろいろあります
バグや機能要望はIssuesに書き込むか、#naumanniのタグをつけてトゥートしてください。

# Demo

https://naumanni.com/

# Feature

Naumanniの特徴は以下の通り

* マルチインスタンス対応
* Docker対応
* SMSライクで使いやすいダイレクトメッセージ機能
* エンドツーエンドの暗号化メッセージング機能(6/10実装予定)
* AIを利用した攻撃的なTootの自動CW機能(6/10実装予定/日本語のみ)
* AIを利用したNSFW自動判定機能(今夏実装予定)

# Who made this?

Naummanniは(株)UEIと(株)glucoseの共同開発プロジェクトです

* Concept and AI: [shi3z@mstdn.onosendai.jp](https://mstdn.onosendai.jp/@shi3z)
* Code : [shn@oppai.tokyo](https://oppai.tokyo/@shn)

# Setup

## Build Dependency

* yarn >= 0.23.4
* node >= v7.5.0
* docker >= 17.03

## Docker

```
$ docker pull naumanni/naumanni-standalone
$ docker run -it -p 8080:80 naumanni/naumanni-standalone
```

ブラウザから http://localhost:8080/ にアクセスすると使えます


# Setup for Developer

## Development

### Build project

```
$ pwd
/path/to/naumanni
$ yarn
$ yarn run build
```

### Serve project

<details>
<summary> Example (serve app with nginx) </summary>

### Install nginx

```
$ brew install nginx
$ mkdir -p /usr/loca/var/run/nginx/proxy_temp
$ echo '127.0.0.1 naumanniskine.localdev' >> /etc/hosts
```

#### project tree

```
.
├── README.md
├── coverage
│   ├── clover.xml
│   ├── coverage-final.json
│   ├── lcov-report
│   └── lcov.info
├── etc
│   └── s3cmd_maintenance.sh
│   ├── deploy.sh
│   ├── deploy_s3_alpha.sh
│   ├── dev
│   │   ├── logs
│   │   │   └── access.log
│   │   ├── nginx
│   │   │   ├── mime.types
│   │   │   ├── nginx.conf
│   │   │   └── uwsgi_params
│   │   ├── nginx.pid
│   │   └── tmp
│   │       └── client_tmp
├── dev.screenrc
├── exclude-files
└── s3cmd_maintenance.sh
├── nginx.conf
├── node_modules
│   ├── ***
├── package.json
├── postcss.config.js
├── raw
│   ├── copy-fonts.sh
│   └── fontello-c1112e15
├── src
│   ├── css
│   └── js
├── static
│   ├── font
│   ├── images
│   ├── main.bundle.js
│   ├── main.bundle.js.map
│   └── main.css
├── webpack.config.babel.js
├── www
│   ├── authorize
│   ├── favicon.ico
│   └── index.html
└── yarn.lock
```

<p>
<details>
<summary> etc/dev/nginx/mime.types </summary>

```

types {
    text/html                             html htm shtml;
    text/css                              css;
    text/xml                              xml;
    image/gif                             gif;
    image/jpeg                            jpeg jpg;
    application/x-javascript              js;
    application/atom+xml                  atom;
    application/rss+xml                   rss;

    text/mathml                           mml;
    text/plain                            txt;
    text/vnd.sun.j2me.app-descriptor      jad;
    text/vnd.wap.wml                      wml;
    text/x-component                      htc;

    image/png                             png;
    image/tiff                            tif tiff;
    image/vnd.wap.wbmp                    wbmp;
    image/x-icon                          ico;
    image/x-jng                           jng;
    image/x-ms-bmp                        bmp;
    image/svg+xml                         svg svgz;
    image/webp                            webp;

    application/java-archive              jar war ear;
    application/mac-binhex40              hqx;
    application/msword                    doc;
    application/pdf                       pdf;
    application/postscript                ps eps ai;
    application/rtf                       rtf;
    application/vnd.ms-excel              xls;
    application/vnd.ms-powerpoint         ppt;
    application/vnd.wap.wmlc              wmlc;
    application/vnd.google-earth.kml+xml  kml;
    application/vnd.google-earth.kmz      kmz;
    application/x-7z-compressed           7z;
    application/x-cocoa                   cco;
    application/x-java-archive-diff       jardiff;
    application/x-java-jnlp-file          jnlp;
    application/x-makeself                run;
    application/x-perl                    pl pm;
    application/x-pilot                   prc pdb;
    application/x-rar-compressed          rar;
    application/x-redhat-package-manager  rpm;
    application/x-sea                     sea;
    application/x-shockwave-flash         swf;
    application/x-stuffit                 sit;
    application/x-tcl                     tcl tk;
    application/x-x509-ca-cert            der pem crt;
    application/x-xpinstall               xpi;
    application/xhtml+xml                 xhtml;
    application/zip                       zip;

    application/octet-stream              bin exe dll;
    application/octet-stream              deb;
    application/octet-stream              dmg;
    application/octet-stream              eot;
    application/octet-stream              iso img;
    application/octet-stream              msi msp msm;

    audio/midi                            mid midi kar;
    audio/mpeg                            mp3;
    audio/ogg                             ogg;
    audio/x-m4a                           m4a;
    audio/x-realaudio                     ra;

    video/3gpp                            3gpp 3gp;
    video/mp4                             mp4;
    video/mpeg                            mpeg mpg;
    video/quicktime                       mov;
    video/webm                            webm;
    video/x-flv                           flv;
    video/x-m4v                           m4v;
    video/x-mng                           mng;
    video/x-ms-asf                        asx asf;
    video/x-ms-wmv                        wmv;
    video/x-msvideo                       avi;
}
```

</details>

<p>
<details>
<summary> etc/dev/nginx/uwsgi_params </summary>

```

uwsgi_param  QUERY_STRING       $query_string;
uwsgi_param  REQUEST_METHOD     $request_method;
uwsgi_param  CONTENT_TYPE       $content_type;
uwsgi_param  CONTENT_LENGTH     $content_length;

uwsgi_param  REQUEST_URI        $request_uri;
uwsgi_param  PATH_INFO          $document_uri;
uwsgi_param  DOCUMENT_ROOT      $document_root;
uwsgi_param  SERVER_PROTOCOL    $server_protocol;

uwsgi_param  REMOTE_ADDR        $remote_addr;
uwsgi_param  REMOTE_PORT        $remote_port;
uwsgi_param  SERVER_PORT        $server_port;
uwsgi_param  SERVER_NAME        $server_name;
```

</details>

<p>
<details>
<summary> etc/dev/nginx/nginx.conf </summary>

```
worker_processes    auto;

error_log    stderr warn;
pid          etc/dev/tmp/nginx.pid;

events {
    worker_connections 256;
}

http {
    default_type    application/octet-stream;

    log_format ltsv "time:$time_local"
                    "\thost:$remote_addr"
                    "\tforwardedfor:$http_x_forwarded_for"
                    "\treq:$request"
                    "\tstatus:$status"
                    "\tsize:$body_bytes_sent"
                    "\treferer:$http_referer"
                    "\tua:$http_user_agent"
                    "\treqtime:$request_time"
                    "\tupsttime:$upstream_response_time"
                    "\tcache:$upstream_http_x_cache"
                    "\truntime:$upstream_http_x_runtime"
                    "\tvhost:$host";
    access_log  etc/dev/logs/access.log ltsv;

    client_body_temp_path etc/dev/tmp/client_tmp;

    sendfile    on;
    #tcp_nopush on;

    keepalive_timeout   60;
    tcp_nodelay      on;

    gzip            on;

    # uwsgi
    proxy_intercept_errors on;  # proxyがエラーを返したときに、nginxのerror_pageを適用する
    # 7秒proxyが処理を返さなければ504: GatewayTimeoutにする。
    proxy_read_timeout 7;
    proxy_connect_timeout 7;
    proxy_redirect off;

    include uwsgi_params;
    include mime.types;

    server {
        listen     7654;
        charset    utf-8;
        server_name naumanniskine.localdev;

        access_log  /dev/stdout ltsv;

        # 1リクエストの大きさを10Mまで許可する
        proxy_max_temp_file_size    0;
        client_max_body_size        10M;

        # error_pages
        error_page 404 /static/error/notfound.html;
        error_page 503 /static/error/maintenance.html;
        error_page 504 /static/error/delay.html;
        error_page 403 /static/error/forbidden.html;
        error_page 500 501 502 /static/error/error.html;

        location /static {
            alias ./static;
        }

        location / {
            root ./www;
            try_files $uri /index.html;
            default_type text/html;
        }
    }

}
```

</details>


### Test

```
$ yarn test
```

### React Storybook

```
$ yarn run storybook
```

</details>

# Contribution / 開発に参加するなら

バグや機能要望はIssuesに書き込むか、#naumanniのタグをつけてトゥートしてください。
Pull Requestも歓迎します!

ToDo管理は[Pivotal Tracker](https://www.pivotaltracker.com/n/projects/2018707)を使っています。
