import requests
import json
import time

# 配置
API_URL = "http://localhost:8000/api/chat/"

# ✅ 这里填入你的真实 User ID
TEST_USER_ID = "9887ed06-d485-48ce-9441-a7ca317d219c"

# 设置 Headers
HEADERS = {
    "Content-Type": "application/json",
    # 模拟前端发送的用户身份 Header
    "x-user-id": TEST_USER_ID
}

def run_test():
    print(f"🚀 开始测试 StudyBudd Chat API (User: {TEST_USER_ID})...")

    # 1. 发送第一条消息 (开启新对话)
    print("\n[Step 1] 发送新消息...")
    payload_1 = {
        "message": "Hello StudyBudd! What can you help me with?",
        "conversation_id": None
    }
    
    try:
        resp = requests.post(API_URL, json=payload_1, headers=HEADERS)
        
        if resp.status_code == 200:
            data = resp.json()
            conversation_id = data['conversation_id']
            ai_reply = data['message']['content']
            
            print(f"✅ 成功! Conversation ID: {conversation_id}")
            print(f"🤖 AI 回复: {ai_reply}")
        else:
            print(f"❌ 失败 (Code {resp.status_code}): {resp.text}")
            return

        # 2. 发送第二条消息 (测试上下文记忆)
        print("\n[Step 2] 发送追问 (测试上下文记忆)...")
        time.sleep(1) # 稍微停顿，防止请求过快
        payload_2 = {
            "message": "Can you give me a specific example of that?",
            "conversation_id": conversation_id
        }
        
        resp_2 = requests.post(API_URL, json=payload_2, headers=HEADERS)
        
        if resp_2.status_code == 200:
            data_2 = resp_2.json()
            print(f"✅ 成功! 追问 ID: {data_2['message']['id']}")
            print(f"🤖 AI 追问回复: {data_2['message']['content']}")
        else:
            print(f"❌ 追问失败: {resp_2.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器。请确保 'uvicorn' 正在运行且端口是 8000。")
    except Exception as e:
        print(f"❌ 发生错误: {e}")

if __name__ == "__main__":
    run_test()