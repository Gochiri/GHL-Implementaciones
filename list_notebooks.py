import sys
import json
import os
from notebooklm_mcp.api_client import NotebookLMClient
from notebooklm_mcp.auth import load_cached_tokens

def get_client():
    cached = load_cached_tokens()
    if not cached:
        print("Error: No cached tokens found. Please run 'notebooklm-mcp-auth' first.")
        sys.exit(1)
    
    return NotebookLMClient(
        cookies=cached.cookies,
        csrf_token=cached.csrf_token,
        session_id=cached.session_id,
    )

def main():
    try:
        client = get_client()
        notebooks = client.list_notebooks()
        
        output = []
        for nb in notebooks:
            output.append({
                "id": nb.id,
                "title": nb.title,
                "source_count": nb.source_count,
                "url": nb.url,
                "ownership": nb.ownership,
            })
        
        print(json.dumps(output, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
