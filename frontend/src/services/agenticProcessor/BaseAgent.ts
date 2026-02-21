/**
 * Base Agent Architecture for Agentic Patent Discovery System
 * Provides standardized interfaces and communication protocol
 */

import { 
  Agent, 
  AgentMessage, 
  AgentMetadata, 
  AgentStage, 
  AgentError,
  PatentData 
} from './types';

/**
 * Abstract base class for all agents in the patent discovery pipeline
 * Ensures consistent interface and communication protocol
 */
export abstract class BaseAgent implements Agent {
  public readonly name: string;
  public readonly version: string;
  protected readonly capabilities: string[];

  constructor(name: string, version: string, capabilities: string[] = []) {
    this.name = name;
    this.version = version;
    this.capabilities = capabilities;
  }

  /**
   * Main processing method - must be implemented by each agent
   */
  abstract process(input: any): Promise<AgentMessage>;

  /**
   * Validate input structure - must be implemented by each agent
   */
  abstract validateInput(input: any): boolean;

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Create standardized agent message
   */
  protected createMessage(
    patentId: string,
    stage: AgentStage,
    data: any,
    processingTime: number,
    confidence: number = 1.0,
    modelUsed?: string
  ): AgentMessage {
    return {
      patentId,
      stage,
      data,
      metadata: {
        agentName: this.name,
        processingTime,
        confidence,
        version: this.version,
        modelUsed
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error message
   */
  protected createError(
    stage: AgentStage,
    error: string,
    input: any
  ): AgentError {
    return {
      agentName: this.name,
      stage,
      error,
      input,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Measure processing time
   */
  protected async measureProcessingTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; processingTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const processingTime = Date.now() - startTime;
    return { result, processingTime };
  }

  /**
   * Log agent activity (can be extended for proper logging)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.name,
      level,
      message,
      data
    };
    
    // For now, just console log - can be extended to proper logging service
    console.log(`[${level.toUpperCase()}] ${this.name}: ${message}`, data || '');
  }
}

/**
 * Agent Registry for managing and discovering agents
 */
export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  /**
   * Register an agent
   */
  register(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  /**
   * Get agent by name
   */
  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents
   */
  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by capability
   */
  getByCapability(capability: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.getCapabilities().includes(capability)
    );
  }

  /**
   * Check if agent exists
   */
  has(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * Remove agent
   */
  unregister(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Get registry status
   */
  getStatus(): {
    totalAgents: number;
    agents: Array<{
      name: string;
      version: string;
      capabilities: string[];
    }>;
  } {
    return {
      totalAgents: this.agents.size,
      agents: Array.from(this.agents.values()).map(agent => ({
        name: agent.name,
        version: agent.version,
        capabilities: agent.getCapabilities()
      }))
    };
  }
}

/**
 * Message Bus for agent communication
 * Handles message passing, validation, and routing
 */
export class AgentMessageBus {
  private messageHistory: AgentMessage[] = [];
  private subscribers: Map<string, ((message: AgentMessage) => void)[]> = new Map();

  /**
   * Send message through the bus
   */
  send(message: AgentMessage): void {
    // Validate message structure
    if (!this.validateMessage(message)) {
      throw new Error(`Invalid message structure from agent: ${message.metadata?.agentName}`);
    }

    // Store in history
    this.messageHistory.push(message);

    // Notify subscribers
    const stageSubscribers = this.subscribers.get(message.stage) || [];
    const allSubscribers = this.subscribers.get('*') || [];
    
    [...stageSubscribers, ...allSubscribers].forEach(subscriber => {
      try {
        subscriber(message);
      } catch (error) {
        console.error('Error in message subscriber:', error);
      }
    });
  }

  /**
   * Subscribe to messages at specific stage or all stages (*)
   */
  subscribe(stage: string, callback: (message: AgentMessage) => void): void {
    if (!this.subscribers.has(stage)) {
      this.subscribers.set(stage, []);
    }
    this.subscribers.get(stage)!.push(callback);
  }

  /**
   * Get message history for a patent
   */
  getHistory(patentId: string): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.patentId === patentId);
  }

  /**
   * Get latest message for a patent at specific stage
   */
  getLatestMessage(patentId: string, stage?: AgentStage): AgentMessage | undefined {
    const messages = this.getHistory(patentId);
    if (stage) {
      return messages.filter(msg => msg.stage === stage).pop();
    }
    return messages.pop();
  }

  /**
   * Clear history (for cleanup)
   */
  clearHistory(patentId?: string): void {
    if (patentId) {
      this.messageHistory = this.messageHistory.filter(msg => msg.patentId !== patentId);
    } else {
      this.messageHistory = [];
    }
  }

  /**
   * Validate message structure
   */
  private validateMessage(message: AgentMessage): boolean {
    return !!(
      message.patentId &&
      message.stage &&
      message.data !== undefined &&
      message.metadata &&
      message.metadata.agentName &&
      message.timestamp
    );
  }

  /**
   * Get message bus statistics
   */
  getStats(): {
    totalMessages: number;
    messagesByStage: Record<string, number>;
    messagesByAgent: Record<string, number>;
  } {
    const messagesByStage: Record<string, number> = {};
    const messagesByAgent: Record<string, number> = {};

    this.messageHistory.forEach(msg => {
      messagesByStage[msg.stage] = (messagesByStage[msg.stage] || 0) + 1;
      messagesByAgent[msg.metadata.agentName] = (messagesByAgent[msg.metadata.agentName] || 0) + 1;
    });

    return {
      totalMessages: this.messageHistory.length,
      messagesByStage,
      messagesByAgent
    };
  }
}

/**
 * Global instances for the application
 */
export const globalAgentRegistry = new AgentRegistry();
export const globalMessageBus = new AgentMessageBus();