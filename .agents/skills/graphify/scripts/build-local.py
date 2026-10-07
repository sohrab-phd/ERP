"""Build the ERP Graphify graph from tracked sources, locally and structurally."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
from importlib.metadata import version


def deny_network(event, args):
    if event in {
        "socket.connect", "socket.connect_ex", "socket.sendto",
        "socket.getaddrinfo", "urllib.Request", "http.client.connect",
    }:
        raise RuntimeError("Graphify ERP indexing forbids network access")


def main():
    if version("graphifyy") != "0.9.79":
        raise SystemExit("Expected reviewed graphifyy 0.9.79; review upgrades first")
    root = Path(__file__).resolve().parents[4]
    if Path.cwd().resolve() != root:
        raise SystemExit("Run from the ERP repository root")
    sys.addaudithook(deny_network)
    from graphify.extract import collect_files, extract
    from graphify.build import build
    from graphify.cluster import cluster
    from graphify.export import to_json

    tracked_raw = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=root
    ).decode("utf-8")
    tracked = set(tracked_raw.split("\0")) - {""}
    excluded_roots = {".git", ".cursor", ".codex", ".agents", "node_modules", "artifacts"}
    supported = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".sql", ".md", ".mdx", ".json"}
    selected = []
    for path in collect_files(root):
        if path.suffix.lower() not in supported:
            continue
        rel = path.relative_to(root).as_posix()
        if rel not in tracked or rel.split("/")[0] in excluded_roots:
            continue
        if path.is_symlink() or not path.resolve().is_relative_to(root):
            continue
        if path.name.startswith(".env") or path.name.endswith(".tsbuildinfo"):
            continue
        selected.append(path)
    if not selected:
        raise SystemExit("No tracked structural sources found")
    out = root / "graphify-out"
    out.mkdir(exist_ok=True)
    # Calling extract directly includes Markdown without invoking semantic LLMs.
    extraction = extract(selected, cache_root=root, root=root, parallel=False)
    graph = build([extraction], directed=True, dedup=False, root=root)
    communities = cluster(graph)
    head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=root, text=True
    ).strip()
    if not to_json(
        graph, communities, str(out / "graph.json"),
        force=True, built_at_commit=head,
    ):
        raise SystemExit("Graph export failed")
    document_nodes = [
        data for _, data in graph.nodes(data=True)
        if str(data.get("source_file", "")).endswith((".md", ".mdx"))
    ]
    code_nodes = [
        data for _, data in graph.nodes(data=True)
        if str(data.get("source_file", "")).endswith((".ts", ".mjs"))
    ]
    sql_nodes = [
        data for _, data in graph.nodes(data=True)
        if str(data.get("source_file", "")).endswith(".sql")
    ]
    if not document_nodes or not code_nodes or not sql_nodes:
        raise SystemExit("Graph must include code, documentation and SQL nodes")
    receipt = {
        "graphify_version": version("graphifyy"),
        "mode": "local-structural-network-blocked",
        "head": head,
        "files": len(selected),
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "document_nodes": len(document_nodes),
        "code_nodes": len(code_nodes),
        "sql_nodes": len(sql_nodes),
        "source_sha256": {
            path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in selected
        },
    }
    (out / "local-build.json").write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )
    (out / ".graphify_python").write_text(sys.executable, encoding="utf-8")
    (out / ".graphify_root").write_text(str(root), encoding="utf-8")
    (out / "GRAPH_REPORT.md").write_text(
        "# Local ERP navigation graph\n\n"
        "Structural extraction only; no semantic or external service processing.\n"
        "Accepted source documents and code remain authoritative.\n\n"
        f"Files: {len(selected)}; nodes: {graph.number_of_nodes()}; "
        f"edges: {graph.number_of_edges()}; communities: {len(communities)}.\n",
        encoding="utf-8",
    )
    print(json.dumps({k: v for k, v in receipt.items() if k != "source_sha256"}, indent=2))


if __name__ == "__main__":
    main()
