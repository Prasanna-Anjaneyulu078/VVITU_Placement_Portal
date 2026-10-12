const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const geminiService = require('./gemini.service');

class RagService {
  /**
   * Split text into meaningful chunks
   */
  chunkText(text, maxChunkSize = 1000) {
    if (!text) return [];
    // Basic chunking by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if (currentChunk.length + p.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += p + '\n\n';
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  /**
   * Index a job into the knowledge base
   */
  async indexJob(job) {
    const documentType = 'JOB';
    const sourceId = job.id.toString();

    // 1. Delete existing chunks for this job
    await prisma.knowledgeDocument.deleteMany({
      where: { type: documentType, sourceId }
    });

    // If job is not approved, don't index it for students
    if (job.status !== 'APPROVED') {
      return;
    }

    // 2. Prepare text content
    const fullContent = `
Job Title: ${job.title || 'N/A'}
Company: ${job.companyName || 'N/A'}
Location: ${job.location || 'N/A'}
Job Type: ${job.jobType || 'N/A'}
Salary Package: ${job.salaryPackage || 'N/A'}
Experience Required: ${job.experienceRequired || 'N/A'}
Required Skills: ${job.requiredSkills || 'N/A'}
Required CGPA: ${job.requiredCgpa || 'N/A'}
Eligible Departments: ${job.eligibleDepartments || 'N/A'}
Description: ${job.description || 'N/A'}
    `.trim();

    // 3. Chunk
    const chunks = this.chunkText(fullContent);

    // 4. Create document
    const document = await prisma.knowledgeDocument.create({
      data: {
        sourceId,
        type: documentType,
        title: `${job.title} at ${job.companyName}`,
        content: fullContent
      }
    });

    // 5. Generate embeddings and save chunks
    for (const textChunk of chunks) {
      const embedding = await geminiService.generateEmbedding(textChunk);
      
      // Save using raw SQL because Prisma vector inserts often need it
      if (embedding && embedding.length > 0) {
        const embeddingString = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO knowledge_chunks (document_id, content, embedding, created_at)
          VALUES ($1, $2, $3::vector, NOW())
        `, Number(document.id), textChunk, embeddingString);
      }
    }
  }

  /**
   * Search vector database for similar chunks
   */
  async searchSimilar(question, limit = 5) {
    const questionEmbedding = await geminiService.generateEmbedding(question);
    if (!questionEmbedding) return [];

    const embeddingString = `[${questionEmbedding.join(',')}]`;

    // Perform vector similarity search using L2 distance (<->) or cosine similarity (<=>)
    // We use cosine similarity (<=>)
    const chunks = await prisma.$queryRawUnsafe(`
      SELECT kc.id, kc.content, kc.document_id as "documentId", 
             kd.title, kd.type, kd.source_id as "sourceId",
             1 - (kc.embedding <=> $1::vector) as similarity
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kc.document_id = kd.id
      ORDER BY kc.embedding <=> $1::vector
      LIMIT $2
    `, embeddingString, limit);

    return chunks.map(c => ({
      id: c.id,
      content: c.content,
      similarity: c.similarity,
      document: {
        id: c.documentId,
        title: c.title,
        type: c.type,
        sourceId: c.sourceId
      }
    }));
  }

  /**
   * Fetch user-specific structured data based on the question
   */
  async fetchStructuredContext(user, question) {
    const q = question.toLowerCase();
    let context = '';

    if (q.includes('application') || q.includes('status')) {
      if (user.role === 'STUDENT') {
        const applications = await prisma.application.findMany({
          where: { studentId: user.student?.id },
          include: { job: true }
        });
        
        if (applications.length > 0) {
          context += `Applications for this student:\n`;
          applications.forEach(app => {
            context += `- Applied to "${app.job?.title}" at ${app.job?.companyName}. Status: ${app.status}\n`;
          });
        } else {
          context += `The student has not applied to any jobs yet.\n`;
        }
      }
    }

    if (q.includes('eligible') || q.includes('eligibility')) {
      if (user.role === 'STUDENT') {
        context += `Student Profile:\n`;
        context += `- CGPA: ${user.student?.cgpa || 'N/A'}\n`;
        context += `- Department: ${user.student?.department || 'N/A'}\n`;
        context += `- Backlogs: ${user.student?.backlogs || 0}\n`;
      }
    }

    return context;
  }
}

module.exports = new RagService();
