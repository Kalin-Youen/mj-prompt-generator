import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time

def start_server():
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    # 寻找可用端口
    port = 8000
    while True:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            break
        except OSError:
            port += 1
            
    url = f"http://localhost:{port}"
    print(f"✨ 提词器已启动!")
    print(f"🌐 访问地址: {url}")
    print("📝 按 Ctrl+C 停止服务")
    
    # 启动浏览器
    threading.Thread(target=lambda: (time.sleep(1), webbrowser.open(url))).start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    start_server()
