class ConversationMemory:
    def __init__(self, dataset_id: str):
        self.dataset_id = dataset_id
        self.messages: list[dict] = []
        self.analysis_history: list[dict] = []

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})

    def add_raw_message(self, message: dict):
        self.messages.append(message)

    def add_analysis_result(self, result: dict):
        summary = {
            "test": result.get("test_display_name", result.get("test_name", "unknown")),
            "statistics": result.get("statistics", {}),
        }
        self.analysis_history.append(summary)
