#!/usr/bin/env python3
"""RLM (Recursive Language Model) Engine

Provides map-reduce style file indexing and chunking for large codebase analysis.
Supports scanning directories, peeking at content matches, and chunking files
for parallel subagent processing.
"""

import glob
import json
import math
from pathlib import Path
from typing import List, Dict, Any

MAX_FILE_SIZE = 1_048_576  # 1 MB

class RLMContext:
    def __init__(self, root_dir: str = "."):
        self.root = Path(root_dir)
        self.index: Dict[str, str] = {}
        self.chunk_size = 5000

    def load_context(self, pattern: str = "**/*", recursive: bool = True):
        files = glob.glob(str(self.root / pattern), recursive=recursive)
        loaded_count = 0
        for f in files:
            path = Path(f)
            if path.is_file() and not any(p in path.parts for p in ['.git', '__pycache__', 'node_modules']):
                if path.stat().st_size > MAX_FILE_SIZE:
                    print(f"RLM: Skipping {path} (exceeds {MAX_FILE_SIZE} byte limit)")
                    continue
                try:
                    self.index[str(path)] = path.read_text(errors='ignore')
                    loaded_count += 1
                except (OSError, UnicodeDecodeError):
                    pass
        return f"RLM: Loaded {loaded_count} files into hidden context. Total size: {sum(len(c) for c in self.index.values())} chars."

    def peek(self, query: str, context_window: int = 200) -> List[str]:
        results = []
        for path, content in self.index.items():
            if query in content:
                start = 0
                while True:
                    idx = content.find(query, start)
                    if idx == -1:
                        break
                    
                    snippet_start = max(0, idx - context_window)
                    snippet_end = min(len(content), idx + len(query) + context_window)
                    snippet = content[snippet_start:snippet_end]
                    results.append(f"[{path}]: ...{snippet}...")
                    start = idx + 1
        return results[:20]

    def get_chunks(self, file_pattern: str = None) -> List[Dict[str, Any]]:
        chunks = []
        targets = [f for f in self.index.keys() if (not file_pattern or file_pattern in f)]
        
        for path in targets:
            content = self.index[path]
            total_chunks = math.ceil(len(content) / self.chunk_size)
            for i in range(total_chunks):
                start = i * self.chunk_size
                end = min((i + 1) * self.chunk_size, len(content))
                chunks.append({
                    "source": path,
                    "chunk_id": i,
                    "content": content[start:end]
                })
        return chunks

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="RLM Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    load_parser = subparsers.add_parser("scan")
    load_parser.add_argument("--path", default=".")
    
    peek_parser = subparsers.add_parser("peek")
    peek_parser.add_argument("query")
    peek_parser.add_argument("--path", default=".")

    chunk_parser = subparsers.add_parser("chunk")
    chunk_parser.add_argument("--pattern", default=None)
    chunk_parser.add_argument("--path", default=".")
    
    args = parser.parse_args()
    
    # Initialize context with path if provided
    root_dir = getattr(args, "path", ".")
    ctx = RLMContext(root_dir=root_dir)
    
    if args.command == "scan":
        # load_context returns the status string
        print(ctx.load_context())
    else:
        # For other commands, load context first (using default root ".")
        ctx.load_context()
        
        if args.command == "peek":
            results = ctx.peek(args.query)
            print(json.dumps(results, indent=2))
        elif args.command == "chunk":
            chunks = ctx.get_chunks(args.pattern)
            print(json.dumps(chunks))
