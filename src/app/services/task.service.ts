import { Injectable } from '@angular/core';
import { BehaviorSubject, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiUrls } from 'src/app/config/constants';
import api from '../config/api.service';

export interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public tasks$ = this.tasksSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor() { }

  // Get tasks organized by status
  get pendingTasks$() {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === 'pending'))
    );
  }

  get inProgressTasks$() {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === 'in-progress'))
    );
  }

  get completedTasks$() {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === 'completed'))
    );
  }

  getAllTasks() {
    this.loadingSubject.next(true);
    return from(api.get(ApiUrls.task.getAllTasks)).pipe(
      tap((response: any) => {
        if (response.data.success && response.data.tasks) {
          this.tasksSubject.next(response.data.tasks);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  createTask(task: Omit<Task, '_id'>) {
    this.loadingSubject.next(true);
    const taskPayload = { ...task, status: 'pending' };

    return from(api.post(ApiUrls.task.createTask, taskPayload)).pipe(
      tap((response: any) => {
        if (response.data.success) {
          this.refreshTasks();
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  updateTask(taskId: string, task: Partial<Task>) {
    this.loadingSubject.next(true);
    return from(api.put(ApiUrls.task.updateTaskByTaskid.replace(':id', taskId), task)).pipe(
      tap((response: any) => {
        if (response.data.success) {
          this.refreshTasks();
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  updateTaskStatus(taskId: string, status: Task['status']) {
    return this.updateTask(taskId, { status });
  }

  deleteTask(taskId: string) {
    this.loadingSubject.next(true);
    return from(api.delete(ApiUrls.task.deleteTaskByTaskid.replace(':id', taskId))).pipe(
      tap((response: any) => {
        if (response.data.success) {
          this.refreshTasks();
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  getTaskById(taskId: string) {
    return from(api.get(ApiUrls.task.getTaskByUserid.replace(':id', taskId)));
  }

  private refreshTasks(): void {
    this.getAllTasks().subscribe();
  }

  // Helper methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'ellipse-outline';
      case 'in-progress': return 'checkmark-outline';
      case 'completed': return 'checkmark-done-outline';
      default: return 'ellipse-outline';
    }
  }
}
